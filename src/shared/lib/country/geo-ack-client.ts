// Client-only helper around the first-visit ack cookie. Mirrors
// cookie-client.ts. The server reads it via ./geo-ack-server.

export const GEO_ACK_COOKIE = '55mas_geo_ack';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Mark the location modal as acknowledged so it never reappears (skip
 * or confirm). Callers should follow with a router refresh/replace so
 * the next RSC render reads the cookie server-side.
 */
export function writeGeoAckCookieClient(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${GEO_ACK_COOKIE}=1;path=/;max-age=${ONE_YEAR_SECONDS};SameSite=Lax`;
}
