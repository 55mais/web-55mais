import { describe, it, expect } from 'vitest';
import { resolveCityQuery } from '../resolve-city-query';

describe('resolveCityQuery', () => {
  it('uuid city_id ⇒ resolve by id (authoritative)', () => {
    expect(
      resolveCityQuery({
        city_id: '11111111-1111-1111-1111-111111111111',
        city_name: 'Lisboa',
      }),
    ).toEqual({ by: 'id', id: '11111111-1111-1111-1111-111111111111' });
  });

  it('no city_id but city_name ⇒ slug heuristic (Mapbox path, no regression)', () => {
    expect(
      resolveCityQuery({ city_id: null, city_name: 'San Sebastián' }),
    ).toEqual({ by: 'slug', slug: 'san-sebastián' });
  });

  it('collapses internal whitespace and trims when slugifying', () => {
    expect(
      resolveCityQuery({ city_id: null, city_name: '  Vila Nova   de Gaia ' }),
    ).toEqual({ by: 'slug', slug: 'vila-nova-de-gaia' });
  });

  it('no city_id and empty city_name ⇒ none', () => {
    expect(resolveCityQuery({ city_id: null, city_name: '' })).toEqual({
      by: 'none',
    });
    expect(resolveCityQuery({ city_id: null, city_name: '   ' })).toEqual({
      by: 'none',
    });
  });

  it('city_id wins even when a city_name is also present', () => {
    expect(
      resolveCityQuery({
        city_id: '22222222-2222-2222-2222-222222222222',
        city_name: 'Madrid',
      }).by,
    ).toBe('id');
  });
});
