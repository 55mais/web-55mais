import { describe, it, expect, vi, beforeEach } from 'vitest';

// FIFO queue of supabase results, consumed in call order. Both
// `.maybeSingle()` and awaiting the builder directly (cities query)
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
  _selectCityUncached,
  getSelectedCity,
} from '../select-city';

const ES = { id: 'es', code: 'ES' };
const CITIES = [
  { id: 'c2', slug: 'madrid', i18n: { es: { name: 'Madrid' } } },
  { id: 'c1', slug: 'barcelona', i18n: { es: { name: 'Barcelona' } } },
];

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

describe('_selectCityUncached', () => {
  it('cookie = valid city_id → that city', async () => {
    h.cookieVal = 'c2';
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await _selectCityUncached('es')).toEqual({
      id: 'c2',
      slug: 'madrid',
      name: 'Madrid',
      countryId: 'es',
      countryCode: 'ES',
    });
  });

  it('cookie = legacy slug → bridges to the real city', async () => {
    h.cookieVal = 'barcelona';
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await _selectCityUncached('es')).toMatchObject({
      id: 'c1',
      slug: 'barcelona',
    });
  });

  it('cookie absent → first alphabetical city', async () => {
    h.results = [
      { data: ES, error: null },
      { data: CITIES, error: null },
    ];
    expect(await _selectCityUncached('es')).toMatchObject({ id: 'c1' });
  });

  it('cookie = unknown value → fallback first city', async () => {
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
