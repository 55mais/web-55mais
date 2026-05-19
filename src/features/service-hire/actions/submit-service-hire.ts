'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/database.types';
import { composeAppointmentUtc } from '@/shared/lib/datetime';
import type { Question } from '@/shared/lib/questions';
import { submitServiceHireSchema } from '../schemas';
import { resolveCityQuery } from '../lib/resolve-city-query';
import { buildOrderPayload, type OrderContact } from './_helpers/build-order-payload';

const FALLBACK_TIMEZONE = 'Europe/Madrid';

type SubmitResult = { data: { orderId: string } } | { error: { message: string } };

const BUCKET = 'order-attachments';

export async function submitServiceHire(formData: FormData): Promise<SubmitResult> {
  const supabase = createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return { error: { message: 'Not authenticated' } };
  }
  const userId = authData.user.id;

  const stateRaw = formData.get('state');
  if (typeof stateRaw !== 'string') {
    return { error: { message: 'Missing state' } };
  }
  let stateJson: unknown;
  try {
    stateJson = JSON.parse(stateRaw);
  } catch {
    return { error: { message: 'Invalid state JSON' } };
  }
  const parsed = submitServiceHireSchema.safeParse(stateJson);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid form' } };
  }
  const state = parsed.data;

  // Load service to know countries/questions.
  const { data: service } = await supabase
    .from('services')
    .select('id, questions')
    .eq('id', state.serviceId)
    .eq('status', 'published')
    .maybeSingle();
  if (!service) {
    return { error: { message: 'Service not found' } };
  }
  const questions = (service.questions as unknown as Question[]) ?? [];

  // Resolve country_id + city_id from address country_code / city_name.
  const { data: country } = await supabase
    .from('countries')
    .select('id, timezone')
    .eq('code', state.address.country_code.toUpperCase())
    .maybeSingle();
  if (!country) {
    return { error: { message: 'Country not supported' } };
  }
  // Service timezone snapshot: persisted on the order so all renders use it
  // regardless of the viewer's TZ. Fallback covers seed gaps defensively.
  const orderTimezone = country.timezone || FALLBACK_TIMEZONE;
  if (!country.timezone) {
    console.warn(
      `[submit-service-hire] country ${state.address.country_code} has no timezone; falling back to ${FALLBACK_TIMEZONE}`,
    );
  }
  // city_id (from the Ciudad select) is authoritative; without it we
  // fall back to the legacy slug heuristic so the Mapbox-only path
  // keeps resolving exactly as before (no regression).
  let serviceCityId: string | null = null;
  const cityQuery = resolveCityQuery(state.address);
  if (cityQuery.by === 'id') {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('id', cityQuery.id)
      .eq('country_id', country.id)
      .eq('is_active', true)
      .maybeSingle();
    serviceCityId = city?.id ?? null;
  } else if (cityQuery.by === 'slug') {
    const { data: city } = await supabase
      .from('cities')
      .select('id')
      .eq('country_id', country.id)
      .ilike('slug', cityQuery.slug)
      .maybeSingle();
    serviceCityId = city?.id ?? null;
  }

  // Compose appointment_date for once schedules. Wall-clock interpreted
  // in the service timezone (not the runtime TZ), then stored as UTC.
  const appointmentDate =
    state.scheduling.schedule_type === 'once' && state.scheduling.start_date
      ? composeAppointmentUtc(
          state.scheduling.start_date,
          state.scheduling.time_start,
          orderTimezone,
        )
      : null;

  // Get current user profile + client_profile for contact fields. Profile
  // carries personal data; client_profile carries fiscal data. Both are
  // optional at this point (anonymous user before save-guest-contact has
  // neither).
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', userId)
    .maybeSingle();
  const { data: clientProfile } = await supabase
    .from('client_profiles')
    .select('fiscal_id_type_id, fiscal_id')
    .eq('user_id', userId)
    .maybeSingle();

  // Ensure a client_profile exists for this user. Service-hire is a client-
  // facing flow: every successful submit must leave the user with a
  // client_profile row so they appear in /admin/clients and the order's
  // client_id has a valid client record.
  const adminClient = createAdminClient();
  const clientProfileError = await ensureClientProfile(adminClient, userId, state.terms_accepted);
  if (clientProfileError) {
    return { error: { message: `Client profile creation failed: ${clientProfileError}` } };
  }

  // Resolve contact + fiscal: form state wins (set by guest flow or signup
  // collection); fall back to client_profile (registered returning client).
  const contact: OrderContact = {
    name: profile?.full_name ?? authData.user.email ?? 'Guest',
    email: profile?.email ?? authData.user.email ?? '',
    phone: profile?.phone ?? '',
    fiscal_id_type_id:
      state.contact_fiscal_id_type_id ?? clientProfile?.fiscal_id_type_id ?? null,
    fiscal_id: state.contact_fiscal_id ?? clientProfile?.fiscal_id ?? null,
  };

  // INSERT order. Files are uploaded after order_id is known so paths are stable.
  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .insert(
      buildOrderPayload({
        userId,
        serviceId: state.serviceId,
        countryId: country.id,
        serviceCityId,
        serviceAddress: state.address.raw_text,
        servicePostalCode: state.address.postal_code || null,
        scheduleType: state.scheduling.schedule_type,
        appointmentDate,
        timezone: orderTimezone,
        contact,
        billing: state.billing,
        notes: state.notes || null,
        answers: state.answers as unknown as Json,
      }),
    )
    .select('id')
    .single();
  if (orderError || !order) {
    return { error: { message: orderError?.message ?? 'Order creation failed' } };
  }
  const orderId = order.id;

  // Upload files: keys with FormData entries named `file:{question_key}:{index}`.
  const uploadedAnswers: Record<string, string[]> = {};
  const fileEntries: Array<[string, File]> = [];
  formData.forEach((value, key) => {
    if (key.startsWith('file:') && value instanceof File) {
      fileEntries.push([key, value]);
    }
  });
  for (const [key, file] of fileEntries) {
    const [, questionKey] = key.split(':');
    const path = `${orderId}/${questionKey}/${file.name}`;
    const { error: upErr } = await adminClient.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      return { error: { message: `File upload failed: ${upErr.message}` } };
    }
    uploadedAnswers[questionKey] = uploadedAnswers[questionKey] ?? [];
    uploadedAnswers[questionKey].push(path);
  }
  if (Object.keys(uploadedAnswers).length > 0) {
    const merged = { ...state.answers, ...uploadedAnswers } as unknown as Json;
    await adminClient.from('orders').update({ form_data: merged }).eq('id', orderId);
  }

  // Insert order_subtypes for answers from subtype-source questions.
  const subtypeRows: Array<{ order_id: string; subtype_id: string; question_key: string }> = [];
  for (const q of questions) {
    if (q.optionsSource !== 'subtype') continue;
    const ans = state.answers[q.key];
    const ids = Array.isArray(ans) ? (ans as string[]) : typeof ans === 'string' && ans ? [ans] : [];
    for (const id of ids) {
      subtypeRows.push({ order_id: orderId, subtype_id: id, question_key: q.key });
    }
  }
  if (subtypeRows.length > 0) {
    const { error: subErr } = await adminClient.from('order_subtypes').insert(subtypeRows);
    if (subErr) {
      return { error: { message: `Subtype mirror failed: ${subErr.message}` } };
    }
  }

  // Insert order_schedule for recurring orders.
  if (state.scheduling.schedule_type === 'recurring') {
    const s = state.scheduling;
    await adminClient.from('order_schedules').insert({
      order_id: orderId,
      start_date: s.start_date,
      end_date: s.end_date ?? null,
      time_start: s.time_start,
      time_end: s.time_end ?? null,
      timezone: orderTimezone,
      weekdays: s.frequency === 'weekly' ? s.weekdays ?? null : null,
      day_of_month: s.frequency === 'monthly' ? s.day_of_month ?? null : null,
      generation_paused: false,
    });
  }

  revalidatePath('/[locale]/dashboard', 'layout');
  return { data: { orderId } };
}

/**
 * Get-or-create the client_profile for the given user. `client_profiles.user_id`
 * is UNIQUE so we can rely on a single SELECT to decide. Returns null on
 * success, or an error message string. Defaults at the column level handle
 * is_business=false / status='active' — we only set user_id and terms_accepted.
 */
async function ensureClientProfile(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  termsAccepted: boolean,
): Promise<string | null> {
  const { data: existing, error: selectErr } = await adminClient
    .from('client_profiles')
    .select('id, terms_accepted')
    .eq('user_id', userId)
    .maybeSingle();
  if (selectErr) return selectErr.message;

  if (!existing) {
    const { error: insertErr } = await adminClient
      .from('client_profiles')
      .insert({ user_id: userId, terms_accepted: termsAccepted });
    return insertErr?.message ?? null;
  }

  if (termsAccepted && !existing.terms_accepted) {
    const { error: updateErr } = await adminClient
      .from('client_profiles')
      .update({ terms_accepted: true })
      .eq('id', existing.id);
    return updateErr?.message ?? null;
  }

  return null;
}
