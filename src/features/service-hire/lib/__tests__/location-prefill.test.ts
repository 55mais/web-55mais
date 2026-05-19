import { describe, it, expect } from 'vitest';
import {
  computeLocationPrefill,
  applyCountryChange,
  applyCitySelect,
} from '../location-prefill';
import { emptyAddress } from '@/shared/components/address-autocomplete';

const city = (over = {}) => ({
  id: 'c-pt-lisboa',
  name: 'Lisboa',
  countryCode: 'PT',
  ...over,
});

describe('computeLocationPrefill', () => {
  it('cookie city in an active country ⇒ prefilled country + city', () => {
    expect(computeLocationPrefill(city(), ['ES', 'PT'])).toEqual({
      countryCode: 'pt',
      cityId: 'c-pt-lisboa',
      cityName: 'Lisboa',
    });
  });

  it('cookie country NOT active ⇒ first active country, empty city', () => {
    expect(
      computeLocationPrefill(city({ countryCode: 'FR' }), ['ES', 'PT']),
    ).toEqual({ countryCode: 'es', cityId: null, cityName: '' });
  });

  it('no cookie ⇒ first active country, empty city', () => {
    expect(computeLocationPrefill(null, ['PT', 'ES'])).toEqual({
      countryCode: 'pt',
      cityId: null,
      cityName: '',
    });
  });

  it('no active countries ⇒ empty prefill', () => {
    expect(computeLocationPrefill(city(), [])).toEqual({
      countryCode: '',
      cityId: null,
      cityName: '',
    });
  });

  it('active codes are matched case-insensitively', () => {
    expect(
      computeLocationPrefill(city({ countryCode: 'pt' }), ['es', 'pt']),
    ).toEqual({ countryCode: 'pt', cityId: 'c-pt-lisboa', cityName: 'Lisboa' });
  });
});

describe('applyCountryChange', () => {
  it('lowercases the code and resets city + Mapbox-derived fields', () => {
    const dirty = {
      ...emptyAddress,
      country_code: 'pt',
      city_id: 'c-pt-lisboa',
      city_name: 'Lisboa',
      street: 'Rua A',
      postal_code: '1000',
      lat: 1,
      lng: 2,
      mapbox_id: 'mb1',
      raw_text: 'Rua A, Lisboa',
    };
    expect(applyCountryChange(dirty, 'ES')).toEqual({
      ...emptyAddress,
      country_code: 'es',
    });
  });
});

describe('applyCitySelect', () => {
  it('sets city_id + city_name, preserves the rest', () => {
    const addr = { ...emptyAddress, country_code: 'es', street: 'Calle 1' };
    expect(applyCitySelect(addr, { id: 'c-es-mad', name: 'Madrid' })).toEqual({
      ...addr,
      city_id: 'c-es-mad',
      city_name: 'Madrid',
    });
  });
});
