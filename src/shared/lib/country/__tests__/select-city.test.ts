import { describe, it, expect, vi, beforeEach } from 'vitest';

// FIFO queue of supabase results, consumed in call order. Both
// `.maybeSingle()` and awaiting the builder directly (cities list query)
// pull the next result.
const h = vi.hoisted(() => ({
  results: [] as Array<{ data: unknown; error: unknown }>,
  cookieVal: undefined as string | undefined,
}));

vi.mock('@/lib/supabase/server', () => {
  const next = () =>
    Promise.resolve(h.results.shift() ?? { data: null, error: null });
  const builder = () => {
    const p: Record<string, unknown> = {};
    p.select = () => p;
    p.eq = () => p;
    p.order = () => p;
    p.limit = () => p;
    p.maybeSingle = () => next();
    p.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      next().then(res, rej);
    return p;
  };
  return { createClient: () => ({ from: () => builder() }) };
});

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () =>
      h.cookieVal === undefined ? undefined : { value: h.cookieVal },
  }),
  headers: () => ({ get: () => '55mas.es' }),
}));

import {
  _resolveDomainCountryUncached,
  _listCitiesUncached,
  _resolveCityByIdUncached,
  _selectCityUncached,
  getSelectedCity,
} from '../select-city';

const ES = { id: 'es', code: 'ES' };
const CITIES = [
  { id: 'c2', slug: 'madrid', i18n: { es: { name: 'Madrid' } } },
  { id: 'c1', slug: 'barcelona', i18n: { es: { name: 'Barcelona' } } },
];

// uuid-shaped cookie values (the live cookie carries a real cities.id).
const PT_CITY_ID = '11111111-1111-4111-8111-111111111111';
const MISSING_CITY_ID = '22222222-2222-4222-8222-222222222222';

// Row shape of the cookie-first join query (`cities` + `countries!inner`).
const PT_CITY_JOIN = {
  id: PT_CITY_ID,
  slug: 'lisboa',
  i18n: { es: { name: 'Lisboa' } },
  countries: { id: 'pt', code: 'PT' },
};

beforeEach(() => {
  h.results = [];
  h.cookieVal = undefined;
});

describe('_resolveDomainCountryUncached', () => {
  it('returns the active domain country (single row via .limit(1))', async () => {
    h.results = [{ data: ES, error: null }];
    expect(await _resolveDomainCountryUncached()).toEqual(ES);
  });

  it('domain country missing → fallback to first active country', async () => {
    h.results = [
      { data: null, error: null },
      { data: { id: 'pt', code: 'PT' }, error: null },
    ];
    expect(await _resolveDomainCountryUncached()).toEqual({
      id: 'pt',
      code: 'PT',
    });
  });

  it('no active countries at all → null', async () => {
    h.results = [
      { data: null, error: null },
      { data: null, error: null },
    ];
    expect(await _resolveDomainCountryUncached()).toBeNull();
  });

  it('throws when supabase errors', async () => {
    h.results = [{ data: null, error: { message: 'boom' } }];
    await expect(_resolveDomainCountryUncached()).rejects.toBeTruthy();
  });
});

describe('_listCitiesUncached', () => {
  it('filters by country, localizes name, sorts alphabetically', async () => {
    h.results = [{ data: CITIES, error: null }];
    expect(await _listCitiesUncached('es', 'es')).toEqual([
      { id: 'c1', slug: 'barcelona', name: 'Barcelona' },
      { id: 'c2', slug: 'madrid', name: 'Madrid' },
    ]);
  });

  it('falls back to ES name, then to slug', async () => {
    h.results = [
      {
        data: [
          { id: 'c1', slug: 'sevilla', i18n: { es: { name: 'Sevilla ES' } } },
          { id: 'c2', slug: 'vigo', i18n: {} },
        ],
        error: null,
      },
    ];
    const out = await _listCitiesUncached('es', 'fr');
    expect(out.find((c) => c.id === 'c1')?.name).toBe('Sevilla ES');
    expect(out.find((c) => c.id === 'c2')?.name).toBe('vigo');
  });

  it('returns [] when no rows', async () => {
    h.results = [{ data: null, error: null }];
    expect(await _listCitiesUncached('es', 'es')).toEqual([]);
  });
});

describe('_resolveCityByIdUncached', () => {
  it('active city + active country → SelectedCity from the joined row', async () => {
    h.results = [{ data: PT_CITY_JOIN, error: null }];
    expect(await _resolveCityByIdUncached(PT_CITY_ID, 'es')).toEqual({
      id: PT_CITY_ID,
      slug: 'lisboa',
      name: 'Lisboa',
      countryId: 'pt',
      countryCode: 'PT',
    });
  });

  it('no matching active row → null (inactive city/country or gone)', async () => {
    h.results = [{ data: null, error: null }];
    expect(await _resolveCityByIdUncached(MISSING_CITY_ID, 'es')).toBeNull();
  });

  it('embedded country missing → null (defensive)', async () => {
    h.results = [
      { data: { ...PT_CITY_JOIN, countries: null }, error: null },
    ];
    expect(await _resolveCityByIdUncached(PT_CITY_ID, 'es')).toBeNull();
  });

  it('localizes name with fallback to slug', async () => {
    h.results = [
      {
        data: { ...PT_CITY_JOIN, i18n: {} },
        error: null,
      },
    ];
    expect(await _resolveCityByIdUncached(PT_CITY_ID, 'fr')).toMatchObject({
      name: 'lisboa',
    });
  });

  it('throws when supabase errors', async () => {
    h.results = [{ data: null, error: { message: 'boom' } }];
    await expect(
      _resolveCityByIdUncached(PT_CITY_ID, 'es'),
    ).rejects.toBeTruthy();
  });
});

describe('_selectCityUncached (cookie-first)', () => {
  it('cookie = uuid of a city in ANOTHER country (PT) on the ES domain → that city wins (1 query, country = PT)', async () => {
    h.cookieVal = PT_CITY_ID;
    h.results = [{ data: PT_CITY_JOIN, error: null }];
    expect(await _selectCityUncached('es')).toEqual({
      id: PT_CITY_ID,
      slug: 'lisboa',
      name: 'Lisboa',
      countryId: 'pt',
      countryCode: 'PT',
    });
  });

  it('cookie absent → domain country (ES), first alphabetical city', async () => {
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await _selectCityUncached('es')).toEqual({
      id: 'c1',
      slug: 'barcelona',
      name: 'Barcelona',
      countryId: 'es',
      countryCode: 'ES',
    });
  });

  it('cookie = uuid that is missing/inactive → degrades to domain path (no throw)', async () => {
    h.cookieVal = MISSING_CITY_ID;
    h.results = [
      { data: null, error: null }, // by-id join: no row
      { data: ES, error: null }, // domain country
      { data: CITIES, error: null }, // domain cities
    ];
    expect(await _selectCityUncached('es')).toMatchObject({
      id: 'c1',
      countryCode: 'ES',
    });
  });

  it('cookie = legacy slug → bridges within the domain country only', async () => {
    h.cookieVal = 'barcelona';
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await _selectCityUncached('es')).toMatchObject({
      id: 'c1',
      slug: 'barcelona',
      countryId: 'es',
    });
  });

  it('cookie = unknown non-uuid value → fallback first city', async () => {
    h.cookieVal = 'does-not-exist';
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await _selectCityUncached('es')).toMatchObject({ id: 'c1' });
  });

  it('country with no active cities → null', async () => {
    h.results = [
      { data: ES, error: null },
      { data: [], error: null },
    ];
    expect(await _selectCityUncached('es')).toBeNull();
  });

  it('no resolvable country → null', async () => {
    h.results = [
      { data: null, error: null },
      { data: null, error: null },
    ];
    expect(await _selectCityUncached('es')).toBeNull();
  });
});

describe('production exports', () => {
  // Under vitest there is no `react-server` cache, so the wrapper is the
  // identity fallback (correct: no request scope to dedup against). The
  // real per-request memoization is exercised by Next at build/runtime.
  it('getSelectedCity is exported and callable', () => {
    expect(typeof getSelectedCity).toBe('function');
  });

  it('cache()-wrapped getSelectedCity behaves like the uncached impl', async () => {
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await getSelectedCity('es')).toMatchObject({ id: 'c1' });
  });
});
