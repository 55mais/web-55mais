// Pure decision for how submit-service-hire must resolve the order's
// city. `city_id` (set by the Ciudad select) is authoritative; without
// it we fall back to the legacy slug heuristic over the localized
// city_name (the Mapbox-only path — kept intact, no regression).

export type CityQuery =
  | { by: 'id'; id: string }
  | { by: 'slug'; slug: string }
  | { by: 'none' };

export function slugifyCityName(cityName: string): string {
  return cityName.trim().toLowerCase().replace(/\s+/g, '-');
}

export function resolveCityQuery(address: {
  city_id?: string | null;
  city_name: string;
}): CityQuery {
  if (address.city_id) return { by: 'id', id: address.city_id };
  const slug = slugifyCityName(address.city_name);
  if (slug) return { by: 'slug', slug };
  return { by: 'none' };
}
