import { describe, it, expect, vi, beforeEach } from 'vitest';

// FIFO queue consumed by both `.maybeSingle()` and direct-await of the
// builder (services query). Mirrors select-city.test.ts.
const h = vi.hoisted(() => ({
  results: [] as Array<{ data: unknown; error: unknown }>,
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

const getSelectedCity = vi.fn();
vi.mock('@/shared/lib/country/cookie-server', () => ({
  getSelectedCity: (...a: unknown[]) => getSelectedCity(...a),
}));
vi.mock('@/shared/lib/country/domain', () => ({
  getDomainCountry: () => 'ES',
}));

import {
  _loadServiceDetailUncached,
  loadServiceDetail,
} from '../lib/load-service-detail';

const CITY = {
  id: 'city1',
  slug: 'bcn',
  name: 'Barcelona',
  countryId: 'c1',
  countryCode: 'ES',
};

function serviceRow(i18n: unknown) {
  return {
    data: [
      {
        id: 's1',
        slug: 'paseos',
        status: 'published',
        cover_image_url: null,
        i18n,
        created_at: '2026-01-01',
      },
    ],
    error: null,
  };
}

const ES_I18N = {
  es: {
    name: 'Paseos',
    description: 'desc',
    includes: 'Acompañamiento',
    hero_subtitle: 'Sub',
    benefits: ['b1', 'b2'],
    guarantees: ['g1'],
    faqs: [{ question: 'P', answer: 'R' }],
  },
};

beforeEach(() => {
  h.results = [];
  getSelectedCity.mockReset();
});

describe('_loadServiceDetailUncached', () => {
  it('found + published → full localized view (city price wins)', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 30 }, error: null },
    ];
    const v = await _loadServiceDetailUncached('es', 'paseos');
    expect(v).toMatchObject({
      id: 's1',
      slug: 'paseos',
      name: 'Paseos',
      description: 'desc',
      includes: 'Acompañamiento',
      benefits: ['b1', 'b2'],
      guarantees: ['g1'],
      faqs: [{ id: 'faq-0', question: 'P', answer: 'R' }],
      price: { amount: 30, currency: 'EUR', source: 'city' },
      coverImageUrl: null,
    });
  });

  it('slug not found → null', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [{ data: [], error: null }];
    expect(await _loadServiceDetailUncached('es', 'x')).toBeNull();
  });

  it('country fallback when no city price', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: 'EUR' }, error: null },
      { data: null, error: null }, // service_cities miss
      { data: { base_price: 49 }, error: null }, // service_countries
    ];
    const v = await _loadServiceDetailUncached('es', 'paseos');
    expect(v?.price).toEqual({ amount: 49, currency: 'EUR', source: 'country' });
  });

  it('no price anywhere → price null', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: 'EUR' }, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ];
    expect((await _loadServiceDetailUncached('es', 'paseos'))?.price).toBeNull();
  });

  it('getSelectedCity null → domain country fallback (no city query)', async () => {
    getSelectedCity.mockResolvedValue(null);
    h.results = [
      serviceRow(ES_I18N),
      { data: { id: 'c1' }, error: null }, // resolveDomainCountryId direct
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 49 }, error: null }, // service_countries
    ];
    const v = await _loadServiceDetailUncached('es', 'paseos');
    expect(v?.price).toEqual({ amount: 49, currency: 'EUR', source: 'country' });
  });

  it('getSelectedCity null + no domain country → price null, service ok', async () => {
    getSelectedCity.mockResolvedValue(null);
    h.results = [
      serviceRow(ES_I18N),
      { data: null, error: null }, // direct miss
      { data: null, error: null }, // fallback miss
    ];
    const v = await _loadServiceDetailUncached('es', 'paseos');
    expect(v?.name).toBe('Paseos');
    expect(v?.price).toBeNull();
  });

  it('locale fallback to ES when target missing', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 10 }, error: null },
    ];
    const v = await _loadServiceDetailUncached('fr', 'paseos');
    expect(v?.name).toBe('Paseos');
    expect(v?.benefits).toEqual(['b1', 'b2']);
  });

  it('array non-masking: empty target array → ES fallback', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow({
        es: { name: 'P', benefits: ['a'] },
        fr: { name: 'P', benefits: [] },
      }),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 10 }, error: null },
    ];
    const v = await _loadServiceDetailUncached('fr', 'paseos');
    expect(v?.benefits).toEqual(['a']);
  });

  it('empty arrays everywhere → [] never null; subtitle/includes null', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow({ es: { name: 'P' } }),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 10 }, error: null },
    ];
    const v = await _loadServiceDetailUncached('es', 'paseos');
    expect(v?.benefits).toEqual([]);
    expect(v?.guarantees).toEqual([]);
    expect(v?.faqs).toEqual([]);
    expect(v?.description).toBeNull();
    expect(v?.includes).toBeNull();
  });

  it('faqs: synthetic ids, drops items with empty question/answer', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow({
        es: {
          name: 'P',
          faqs: [
            { question: 'Q1', answer: 'A1' },
            { question: '', answer: 'A2' },
            { question: 'Q3', answer: '   ' },
          ],
        },
      }),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 10 }, error: null },
    ];
    const v = await _loadServiceDetailUncached('es', 'paseos');
    expect(v?.faqs).toEqual([{ id: 'faq-0', question: 'Q1', answer: 'A1' }]);
  });

  it('empty currency → price null despite base_price', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: '   ' }, error: null },
    ];
    expect((await _loadServiceDetailUncached('es', 'paseos'))?.price).toBeNull();
  });

  it('base_price 0 / non-numeric → tier rejected', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: '0' }, error: null }, // city rejected
      { data: { base_price: 'abc' }, error: null }, // country rejected
    ];
    expect((await _loadServiceDetailUncached('es', 'paseos'))?.price).toBeNull();
  });

  it('throws when services query errors', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [{ data: null, error: { message: 'boom' } }];
    await expect(_loadServiceDetailUncached('es', 'paseos')).rejects.toBeTruthy();
  });
});

describe('production export', () => {
  it('loadServiceDetail callable, behaves like uncached', async () => {
    getSelectedCity.mockResolvedValue(CITY);
    h.results = [
      serviceRow(ES_I18N),
      { data: { currency: 'EUR' }, error: null },
      { data: { base_price: 30 }, error: null },
    ];
    expect(typeof loadServiceDetail).toBe('function');
    expect((await loadServiceDetail('es', 'paseos'))?.name).toBe('Paseos');
  });
});
