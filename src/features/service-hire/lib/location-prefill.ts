import type { AddressValue } from '@/shared/components/address-autocomplete';

// Pure prefill/transition logic for the País + Ciudad selects. Kept
// out of the wizard component so the cookie→country/city resolution
// and the "country change resets city/Mapbox" rule are unit-tested.

type SelectedCityLike = {
  id: string;
  name: string;
  countryCode: string; // ISO-2, any case
};

export type LocationPrefill = {
  countryCode: string; // lowercase; '' when no active country
  cityId: string | null;
  cityName: string;
};

export function computeLocationPrefill(
  selected: SelectedCityLike | null,
  activeCountryCodes: string[],
): LocationPrefill {
  const active = activeCountryCodes.map((c) => c.toLowerCase());
  if (active.length === 0) {
    return { countryCode: '', cityId: null, cityName: '' };
  }

  if (selected) {
    const code = selected.countryCode.toLowerCase();
    if (active.includes(code)) {
      return { countryCode: code, cityId: selected.id, cityName: selected.name };
    }
  }

  return { countryCode: active[0], cityId: null, cityName: '' };
}

// Changing country invalidates everything downstream: the chosen city
// belonged to the old country, and the Mapbox-resolved street/postal/
// coords were filtered by the old country. Reset all of it.
export function applyCountryChange(
  addr: AddressValue,
  code: string,
): AddressValue {
  return {
    ...addr,
    country_code: code.toLowerCase(),
    city_id: null,
    city_name: '',
    street: '',
    postal_code: '',
    lat: null,
    lng: null,
    mapbox_id: null,
    raw_text: '',
  };
}

export function applyCitySelect(
  addr: AddressValue,
  city: { id: string; name: string },
): AddressValue {
  return { ...addr, city_id: city.id, city_name: city.name };
}
