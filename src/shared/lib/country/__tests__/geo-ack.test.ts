import { describe, it, expect, vi, beforeEach } from 'vitest';

// Server reader uses next/headers; mirror the FIFO/get mock style of
// select-city.test.ts (single cookie value here).
const h = vi.hoisted(() => ({ ack: undefined as string | undefined }));
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () => (h.ack === undefined ? undefined : { value: h.ack }),
  }),
}));

import { GEO_ACK_COOKIE, writeGeoAckCookieClient } from '../geo-ack-client';
import { hasGeoAck } from '../geo-ack-server';

describe('geo-ack cookie helpers', () => {
  beforeEach(() => {
    h.ack = undefined;
    // jsdom keeps cookies between tests within a file; expire ours.
    document.cookie = `${GEO_ACK_COOKIE}=;max-age=0;path=/`;
  });

  it('GEO_ACK_COOKIE is 55mas_geo_ack', () => {
    expect(GEO_ACK_COOKIE).toBe('55mas_geo_ack');
  });

  it('writeGeoAckCookieClient writes value "1" under the ack cookie', () => {
    writeGeoAckCookieClient();
    expect(document.cookie).toContain(`${GEO_ACK_COOKIE}=1`);
  });

  it('hasGeoAck → true only when the cookie value is exactly "1"', () => {
    h.ack = '1';
    expect(hasGeoAck()).toBe(true);
  });

  it('hasGeoAck → false when the cookie is absent', () => {
    expect(hasGeoAck()).toBe(false);
  });

  it('hasGeoAck → false when the cookie value is not "1"', () => {
    h.ack = '0';
    expect(hasGeoAck()).toBe(false);
  });
});
