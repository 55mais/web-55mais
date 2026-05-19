'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AddressAutocomplete,
  type AddressValue,
} from '@/shared/components/address-autocomplete';
import {
  applyCountryChange,
  applyCitySelect,
} from '../../lib/location-prefill';
import type { HireLocationOptions } from '../../lib/hire-location-types';
import type { ServiceHireHints } from '../../lib/build-hints';

type Props = {
  address: AddressValue;
  onChange: (address: AddressValue) => void;
  options: HireLocationOptions;
  locale: string;
  hints: ServiceHireHints;
  hasError: boolean;
};

// Step 1 — País + Ciudad selects (authoritative) + Mapbox address.
// The selects own country_code / city_id / city_name; Mapbox only
// fills street/postal/coords and never overwrites the chosen
// country/city (the onChange below re-imposes the select values).
export function StepOneLocation({
  address,
  onChange,
  options,
  locale,
  hints,
  hasError,
}: Props) {
  const country = address.country_code;
  const cities = options.citiesByCountry[country] ?? [];
  const loc = hints.location;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hire-country">{loc.countryLabel}</Label>
          <Select
            value={country}
            onValueChange={(v) =>
              onChange(applyCountryChange(address, v ?? ''))
            }
          >
            <SelectTrigger id="hire-country">
              <SelectValue placeholder={loc.countryPlaceholder}>
                {(v: string) =>
                  options.countries.find((c) => c.code === v)?.name ??
                  loc.countryPlaceholder
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hire-city">{loc.cityLabel}</Label>
          <Select
            value={address.city_id ?? ''}
            onValueChange={(v) => {
              const picked = cities.find((c) => c.id === v);
              if (picked) onChange(applyCitySelect(address, picked));
            }}
          >
            <SelectTrigger id="hire-city" disabled={cities.length === 0}>
              <SelectValue placeholder={loc.cityPlaceholder}>
                {(v: string) =>
                  cities.find((c) => c.id === v)?.name ?? loc.cityPlaceholder
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">{hints.addressLabel}</Label>
        <AddressAutocomplete
          id="address"
          value={address}
          // Mapbox must not override the País/Ciudad selects: keep the
          // chosen country/city, take only the geocoded fields.
          onChange={(v) =>
            onChange({
              ...v,
              country_code: address.country_code,
              city_id: address.city_id,
              city_name: address.city_name,
            })
          }
          countryCodes={country ? [country] : []}
          language={locale}
          placeholder={hints.addressPlaceholder}
          hasError={hasError}
        />
      </div>
    </div>
  );
}
