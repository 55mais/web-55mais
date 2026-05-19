import 'server-only';
import { cookies } from 'next/headers';
import { GEO_ACK_COOKIE } from './geo-ack-client';

export { GEO_ACK_COOKIE };

/**
 * True once the visitor has skipped or confirmed the location modal.
 * Read in `PublicShell` (RSC) so the modal — and its JS — is never
 * sent on return visits (no flash).
 */
export function hasGeoAck(): boolean {
  return cookies().get(GEO_ACK_COOKIE)?.value === '1';
}
