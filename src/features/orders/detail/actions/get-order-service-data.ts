'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { AssignedSubtypeGroup, Question } from '@/shared/lib/questions/types';
import type { OrderScheduleType } from '../../types';
import type {
  OrderSeriesStatus,
  OrderSeriesSummary,
  ServiceTabContext,
  ServiceTabData,
} from '../types';

type Result = {
  data: ServiceTabData;
  context: ServiceTabContext;
};

export async function getOrderServiceData(
  orderId: string,
  locale: string,
): Promise<Result | null> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, service_id, preferred_language, service_address, service_city_id, service_postal_code, schedule_type, notes, talents_needed, form_data, appointment_date, series_id, sequence_no',
    )
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return null;

  const seriesRowRes = order.series_id
    ? await supabase
        .from('order_series')
        .select(
          'id, status, frequency, weekdays, day_of_month, repeat_every, time_start, time_end, hours_per_session, timezone, start_date, last_appointment_at, total_occurrences, occurrences_completed, occurrences_cancelled',
        )
        .eq('id', order.series_id)
        .maybeSingle()
    : { data: null };

  const [
    serviceRes,
    langsRes,
    countriesRes,
    citiesRes,
    recurrenceRes,
    groupAssignmentsRes,
  ] = await Promise.all([
    order.service_id
      ? supabase
          .from('services')
          .select('id, slug, i18n, questions')
          .eq('id', order.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('spoken_languages')
      .select('code, i18n')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('countries').select('id, code, i18n').eq('is_active', true),
    supabase.from('cities').select('id, country_id, i18n'),
    supabase
      .from('order_recurrence')
      .select('repeat_every, weekdays, start_date, end_date, time_window_start, time_window_end, hours_per_session')
      .eq('order_id', orderId)
      .maybeSingle(),
    order.service_id
      ? supabase
          .from('service_subtype_group_assignments')
          .select(
            `group_id,
             service_subtype_groups (
               id, slug, i18n,
               service_subtypes ( id, slug, i18n, is_active, sort_order )
             )`,
          )
          .eq('service_id', order.service_id)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const service = serviceRes.data;
  const questions = ((service?.questions as unknown) as Question[]) ?? [];
  const answers = ((order.form_data as unknown) as Record<string, unknown>) ?? {};
  const recurrence = recurrenceRes.data;

  const data: ServiceTabData = {
    language: { preferred_language: order.preferred_language ?? null },
    address: {
      service_address: order.service_address,
      service_city_id: order.service_city_id,
      service_postal_code: order.service_postal_code,
    },
    serviceAnswers: {
      service_id: order.service_id,
      service_name: service
        ? localizedField(service.i18n as I18nRecord, locale, 'name') ?? service.slug
        : null,
      questions,
      answers,
    },
    recurrence: {
      schedule_type: (order.schedule_type as OrderScheduleType) ?? 'once',
      repeat_every: recurrence?.repeat_every ?? 1,
      weekdays: recurrence?.weekdays ?? [],
      start_date: recurrence?.start_date ?? (order.appointment_date?.substring(0, 10) ?? null),
      end_date: recurrence?.end_date ?? null,
      time_window_start: recurrence?.time_window_start ?? null,
      time_window_end: recurrence?.time_window_end ?? null,
      hours_per_session:
        recurrence?.hours_per_session === null || recurrence?.hours_per_session === undefined
          ? null
          : Number(recurrence.hours_per_session),
    },
    notesData: {
      notes: order.notes ?? null,
      talents_needed: order.talents_needed ?? 1,
    },
    series: composeSeriesSummary(seriesRowRes.data, order.sequence_no),
    appointment_date: order.appointment_date,
  };

  const assignedGroups: AssignedSubtypeGroup[] = ((groupAssignmentsRes.data ?? []) as unknown as Array<{
    service_subtype_groups: {
      id: string;
      slug: string;
      i18n: I18nRecord;
      service_subtypes: Array<{
        id: string;
        slug: string;
        i18n: I18nRecord;
        is_active: boolean;
        sort_order: number;
      }>;
    } | null;
  }>)
    .map((row) => {
      const g = row.service_subtype_groups;
      if (!g) return null;
      return {
        id: g.id,
        slug: g.slug,
        translations: extractTranslations(g.i18n, 'name'),
        items: (g.service_subtypes ?? [])
          .filter((it) => it.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((it) => ({
            id: it.id,
            slug: it.slug,
            translations: extractTranslations(it.i18n, 'name'),
          })),
      } satisfies AssignedSubtypeGroup;
    })
    .filter((g): g is AssignedSubtypeGroup => g !== null);

  const context: ServiceTabContext = {
    spokenLanguages: (langsRes.data ?? []).map((l) => ({
      code: l.code,
      name: localizedField(l.i18n as I18nRecord, locale, 'name') ?? l.code,
    })),
    countries: (countriesRes.data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? c.code,
    })),
    cities: (citiesRes.data ?? []).map((c) => ({
      id: c.id,
      country_id: c.country_id,
      name: localizedField(c.i18n as I18nRecord, locale, 'name') ?? '',
    })),
    assignedGroups,
  };

  return { data, context };
}

type SeriesRow = {
  id: string;
  status: string;
  frequency: string;
  weekdays: number[] | null;
  day_of_month: number | null;
  repeat_every: number;
  time_start: string;
  time_end: string | null;
  hours_per_session: number | string | null;
  timezone: string;
  start_date: string;
  last_appointment_at: string | null;
  total_occurrences: number;
  occurrences_completed: number;
  occurrences_cancelled: number;
} | null;

function composeSeriesSummary(row: SeriesRow, sequenceNo: number | null): OrderSeriesSummary | null {
  if (!row || sequenceNo === null) return null;
  return {
    id: row.id,
    sequence_no: sequenceNo,
    total_occurrences: row.total_occurrences,
    occurrences_completed: row.occurrences_completed,
    occurrences_cancelled: row.occurrences_cancelled,
    status: row.status as OrderSeriesStatus,
    frequency: row.frequency as 'weekly' | 'monthly',
    weekdays: row.weekdays,
    day_of_month: row.day_of_month,
    repeat_every: row.repeat_every,
    time_start: row.time_start,
    time_end: row.time_end,
    hours_per_session: row.hours_per_session === null ? null : Number(row.hours_per_session),
    start_date: row.start_date,
    timezone: row.timezone,
    last_appointment_at: row.last_appointment_at,
  };
}

function extractTranslations(i18n: I18nRecord, field: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [loc, entry] of Object.entries(i18n)) {
    const v = (entry as Record<string, unknown>)[field];
    if (typeof v === 'string') out[loc] = v;
  }
  return out;
}
