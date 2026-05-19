'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import {
  getSelectedCity,
  listCitiesForCountry,
} from '@/shared/lib/country/cookie-server';
import type {
  HireCityOption,
  HireCountryOption,
  HireLocationOptions,
} from '../lib/hire-location-types';
import { getServiceForHire } from './get-service-for-hire';

const EMPTY: HireLocationOptions = {
  countries: [],
  citiesByCountry: {},
  selected: null,
};

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function getHireLocationOptions(
  serviceId: string,
  locale: string,
): Promise<HireLocationOptions> {
  const service = await getServiceForHire(serviceId, locale);
  if (!service || service.activeCountryCodes.length === 0) return EMPTY;

  const supabase = createClient();
  const codes = service.activeCountryCodes.map((c) => c.toUpperCase());
  const { data: countryRows } = await supabase
    .from('countries')
    .select('id, code, i18n, sort_order')
    .in('code', codes)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const rows = countryRows ?? [];
  const countries: HireCountryOption[] = rows.map((r) => ({
    code: r.code.toLowerCase(),
    name: localizedField(r.i18n as I18nRecord, locale, 'name') ?? r.code,
  }));

  const citiesByCountry: Record<string, HireCityOption[]> = {};
  for (const r of rows) {
    const cities = await listCitiesForCountry(r.id, locale);
    citiesByCountry[r.code.toLowerCase()] = cities.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }

  const selected = await getSelectedCity(locale);

  return { countries, citiesByCountry, selected };
}
