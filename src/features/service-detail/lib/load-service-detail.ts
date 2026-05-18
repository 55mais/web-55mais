import 'server-only';
import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
import { getDomainCountry } from '@/shared/lib/country/domain';
import { localizedField } from '@/shared/lib/i18n/localize';
import { buildCoverPublicUrl } from '@/shared/lib/services/cover-image-storage';
import type {
  ServiceDetailFaq,
  ServiceDetailPrice,
  ServiceDetailView,
} from '../types';

// `React.cache` only resolves under the `react-server` condition
// (present in Next RSC, absent in vitest). It is a per-request
// memoization optimization — identical results with or without it —
// so an identity fallback outside a request scope is correct.
type CacheFn = <T extends (...args: never[]) => unknown>(fn: T) => T;
const cache: CacheFn =
  typeof (React as { cache?: CacheFn }).cache === 'function'
    ? (React as { cache: CacheFn }).cache
    : (fn) => fn;

type ServiceI18n = Record<string, Record<string, unknown>> | null;
type Supabase = ReturnType<typeof createClient>;

function trimToNull(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  return t.length > 0 ? t : null;
}

function localizeArray(
  i18n: ServiceI18n,
  locale: string,
  field: string,
): string[] {
  const pick = (loc: string): unknown => i18n?.[loc]?.[field];
  const target = pick(locale);
  const raw = Array.isArray(target) && target.length > 0 ? target : pick('es');
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);
}

function mapFaqs(
  i18n: ServiceI18n,
  locale: string,
): ServiceDetailFaq[] {
  const pick = (loc: string): unknown => i18n?.[loc]?.faqs;
  const target = pick(locale);
  const raw = Array.isArray(target) && target.length > 0 ? target : pick('es');
  if (!Array.isArray(raw)) return [];
  const out: ServiceDetailFaq[] = [];
  raw.forEach((entry, i) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const q = typeof item.question === 'string' ? item.question.trim() : '';
    const a = typeof item.answer === 'string' ? item.answer : '';
    if (q.length > 0 && a.trim().length > 0) {
      out.push({ id: `faq-${i}`, question: q, answer: a });
    }
  });
  return out;
}

async function resolveDomainCountryId(
  supabase: Supabase,
): Promise<string | null> {
  const direct = await supabase
    .from('countries')
    .select('id')
    .eq('code', getDomainCountry())
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (direct.error) throw direct.error;
  if (direct.data) return direct.data.id;

  const fallback = await supabase
    .from('countries')
    .select('id')
    .eq('is_active', true)
    .order('code', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return fallback.data?.id ?? null;
}

function coercePrice(value: unknown): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function resolvePrice(
  supabase: Supabase,
  serviceId: string,
  cityId: string | null,
  countryId: string | null,
): Promise<ServiceDetailPrice | null> {
  if (!countryId) return null;

  const cur = await supabase
    .from('countries')
    .select('currency')
    .eq('id', countryId)
    .limit(1)
    .maybeSingle();
  if (cur.error) throw cur.error;
  const currency = (cur.data?.currency ?? '').trim();
  if (!currency) return null;

  if (cityId) {
    const city = await supabase
      .from('service_cities')
      .select('base_price')
      .eq('service_id', serviceId)
      .eq('city_id', cityId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (city.error) throw city.error;
    const amount = coercePrice(city.data?.base_price);
    if (amount !== null) return { amount, currency, source: 'city' };
  }

  const country = await supabase
    .from('service_countries')
    .select('base_price')
    .eq('service_id', serviceId)
    .eq('country_id', countryId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (country.error) throw country.error;
  const amount = coercePrice(country.data?.base_price);
  return amount !== null ? { amount, currency, source: 'country' } : null;
}

export async function _loadServiceDetailUncached(
  locale: string,
  slug: string,
): Promise<ServiceDetailView | null> {
  const supabase = createClient();

  const { data: rows, error } = await supabase
    .from('services')
    .select('id, slug, status, cover_image_url, i18n, created_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const service = (rows ?? [])[0];
  if (!service) return null;

  const city = await getSelectedCity(locale);
  const cityId = city?.id ?? null;
  const countryId = city?.countryId ?? (await resolveDomainCountryId(supabase));

  const price = await resolvePrice(supabase, service.id, cityId, countryId);

  const i18n = (service.i18n as ServiceI18n) ?? null;
  const localized = (field: string) =>
    localizedField(i18n ?? undefined, locale, field);

  return {
    id: service.id,
    slug: service.slug,
    name: localized('name') ?? service.slug,
    description: trimToNull(localized('description')),
    includes: trimToNull(localized('includes')),
    benefits: localizeArray(i18n, locale, 'benefits'),
    guarantees: localizeArray(i18n, locale, 'guarantees'),
    faqs: mapFaqs(i18n, locale),
    coverImageUrl: buildCoverPublicUrl(service.cover_image_url, 'hero'),
    price,
  };
}

export const loadServiceDetail = cache(_loadServiceDetailUncached);
