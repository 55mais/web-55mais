import 'server-only';
import * as React from 'react';
import { cookies } from 'next/headers';

// `React.cache` is only exported under the `react-server` condition
// (present in Next.js RSC at build/runtime, absent in plain Node such
// as vitest). It is a per-request memoization *optimization* — results
// are identical with or without it — so an identity fallback outside a
// request scope is correct, not a workaround.
type CacheFn = <T extends (...args: never[]) => unknown>(fn: T) => T;
const cache: CacheFn =
  typeof (React as { cache?: CacheFn }).cache === 'function'
    ? (React as { cache: CacheFn }).cache
    : (fn) => fn;
import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import { getDomainCountry } from './domain';

// DB-backed resolver for the public city locator. Replaces the old
// hardcoded LOCATOR_CITIES list: cities now come from the `cities` table
// for the domain country, and the location cookie carries a real
// `cities.id` (uuid) so downstream pricing can resolve exact per-city
// rates. The legacy bridge still accepts old slug cookies.

export const LOCATION_COOKIE = '55mas_location';

export type SelectedCity = {
  id: string; // cities.id (uuid) — the cookie value
  slug: string; // cities.slug (legacy bridge + debug)
  name: string; // localized cities.i18n[locale].name
  countryId: string; // countries.id
  countryCode: string; // countries.code (ISO-2)
};

export type LocatorCityOption = { id: string; name: string };

type CityRow = LocatorCityOption & { slug: string };
type DomainCountryRow = { id: string; code: string };
type I18nRecord = Record<string, Record<string, unknown>> | null;

// --- uncached internals (tested directly to avoid React.cache()
// memoizing across unit-test cases that share the same args) ---------

export async function _resolveDomainCountryUncached(): Promise<DomainCountryRow | null> {
  const supabase = createClient();

  const direct = await supabase
    .from('countries')
    .select('id, code')
    .eq('code', getDomainCountry())
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (direct.error) throw direct.error;
  if (direct.data) return direct.data;

  // Domain country missing/inactive → deterministic fallback: first
  // active country by code asc (degrades, never throws).
  const fallback = await supabase
    .from('countries')
    .select('id, code')
    .eq('is_active', true)
    .order('code', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return fallback.data ?? null;
}

export async function _listCitiesUncached(
  countryId: string,
  locale: string,
): Promise<CityRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, slug, i18n')
    .eq('country_id', countryId)
    .eq('is_active', true);
  if (error) throw error;

  return (data ?? [])
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name:
        localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function _selectCityUncached(
  locale: string,
): Promise<SelectedCity | null> {
  const country = await _resolveDomainCountryUncached();
  if (!country) return null;

  const cityRows = await _listCitiesUncached(country.id, locale);
  if (cityRows.length === 0) return null;

  const cookieVal = cookies().get(LOCATION_COOKIE)?.value;
  const match =
    (cookieVal && cityRows.find((c) => c.id === cookieVal)) ||
    // Legacy bridge: old cookies stored a slug ('barcelona'). Resolve
    // it to the real city when the domain country has it; otherwise
    // fall through to the first alphabetical city.
    (cookieVal && cityRows.find((c) => c.slug === cookieVal)) ||
    cityRows[0];

  return {
    id: match.id,
    slug: match.slug,
    name: match.name,
    countryId: country.id,
    countryCode: country.code,
  };
}

// --- production exports (per-request dedup via React.cache) ----------

export const listCitiesForCountry = cache(_listCitiesUncached);
export const getSelectedCity = cache(_selectCityUncached);
