import 'server-only';

// Server-only re-exports around the location cookie. The resolver lives
// in ./select-city (DB-backed). This module preserves the existing
// `@/shared/lib/country/cookie-server` import path so consumers don't
// need to change their import specifier. The client counterpart lives
// in ./cookie-client.ts.

export {
  LOCATION_COOKIE,
  getSelectedCity,
  listCitiesForCountry,
} from './select-city';
export type { SelectedCity, LocatorCityOption } from './select-city';
