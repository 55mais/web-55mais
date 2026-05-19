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

// The location cookie carries a real `cities.id` (uuid). Old cookies
// stored a slug ('barcelona'); distinguish the two by shape so the
// untrusted cookie value never reaches the wrong query path.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

type CityByIdRow = {
  id: string;
  slug: string;
  i18n: I18nRecord;
  countries: DomainCountryRow | DomainCountryRow[] | null;
};

// Cookie-first resolution: a uuid cookie references an exact `cities.id`
// and carries its own country via the join, so it overrides the domain
// (a Barcelona cookie on the `.pt` domain stays Barcelona). One
// round-trip; returns null when the city or its country is inactive/gone
// so the caller can degrade to the domain path.
export async function _resolveCityByIdUncached(
  id: string,
  locale: string,
): Promise<SelectedCity | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('cities')
    .select('id, slug, i18n, countries!inner(id, code)')
    .eq('id', id)
    .eq('is_active', true)
    .eq('countries.is_active', true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as CityByIdRow;
  const country = Array.isArray(row.countries)
    ? row.countries[0]
    : row.countries;
  if (!country) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: localizedField(row.i18n, locale, 'name') ?? row.slug,
    countryId: country.id,
    countryCode: country.code,
  };
}

export async function _selectCityUncached(
  locale: string,
): Promise<SelectedCity | null> {
  const cookieVal = cookies().get(LOCATION_COOKIE)?.value;

  // 1. uuid cookie → exact city, country from the join (cookie wins
  //    over domain). Inactive/missing falls through to the domain path.
  if (cookieVal && UUID_RE.test(cookieVal)) {
    const byId = await _resolveCityByIdUncached(cookieVal, locale);
    if (byId) return byId;
  }

  const country = await _resolveDomainCountryUncached();
  if (!country) return null;

  const cityRows = await _listCitiesUncached(country.id, locale);
  if (cityRows.length === 0) return null;

  // 2. Legacy slug cookie: bridge within the domain country only (no
  //    global slug lookup → avoids cross-country slug ambiguity).
  // 3. No/unmatched cookie: first alphabetical city.
  const match =
    (cookieVal && cityRows.find((c) => c.slug === cookieVal)) || cityRows[0];

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
