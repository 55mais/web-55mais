// Mirrors @/shared/lib/country SelectedCity. Declared locally so this
// client-importable module never pulls the server-only resolver.
export type SelectedCityLike = {
  id: string;
  slug: string;
  name: string;
  countryId: string;
  countryCode: string;
};

export type HireCountryOption = { code: string; name: string };
export type HireCityOption = { id: string; name: string };

export type HireLocationOptions = {
  // Active countries for this service, localized, sorted by sort_order.
  countries: HireCountryOption[];
  // Cities per country, keyed by lowercase ISO-2 code. Pre-loaded for
  // every active country so changing the País select needs no client
  // round-trip.
  citiesByCountry: Record<string, HireCityOption[]>;
  // Cookie-resolved city (cookie-first) used to prefill País + Ciudad.
  selected: SelectedCityLike | null;
};
