// Universal exports (safe in client + server). Cookie helpers live in
// ./cookie-server (server) and ./cookie-client (client) and must be
// imported from those modules directly. Splitting them prevents
// next/headers from leaking into client bundles.

export type { SelectedCity, LocatorCityOption } from './select-city';
export type { DomainCountry } from './domain';
