import { describe, it, expect } from 'vitest';
import { composeOrderDetail } from '../compose-order-detail';

const baseOrder = {
  id: 'order-1',
  order_number: 1,
  service_id: null,
  status: 'pendiente',
  payment_status: null,
  appointment_date: '2026-05-10T08:00:00.000Z', // 10:00 in Madrid CEST
  schedule_type: 'once',
  price_total: 0,
  price_subtotal: 0,
  price_tax: 0,
  price_tax_rate: 0,
  currency: 'EUR',
  staff_member_id: null,
  client_id: 'client-1',
  talents_needed: 1,
  created_at: null,
  updated_at: null,
};

const baseArgs = {
  service: null,
  client: null,
  staffMember: null,
  tags: [],
  scheduleSummary: 'Sesión única',
  seriesRow: null,
  sequenceNo: null,
  locale: 'es',
};

describe('composeOrderDetail', () => {
  it('formats start_time and end_time in the order timezone (Madrid)', () => {
    const detail = composeOrderDetail({
      ...baseArgs,
      order: { ...baseOrder, timezone: 'Europe/Madrid' },
    });
    expect(detail.start_time).toBe('10:00');
    expect(detail.end_time).toBe('11:00');
    expect(detail.timezone).toBe('Europe/Madrid');
  });

  it('formats start_time and end_time in the order timezone (Lisbon)', () => {
    // Same UTC instant interpreted in Lisbon WEST (UTC+1) → 09:00 local.
    const detail = composeOrderDetail({
      ...baseArgs,
      order: { ...baseOrder, timezone: 'Europe/Lisbon' },
    });
    expect(detail.start_time).toBe('09:00');
    expect(detail.end_time).toBe('10:00');
    expect(detail.timezone).toBe('Europe/Lisbon');
  });

  it('returns null start/end when appointment_date is missing', () => {
    const detail = composeOrderDetail({
      ...baseArgs,
      order: { ...baseOrder, appointment_date: null, timezone: 'Europe/Madrid' },
    });
    expect(detail.start_time).toBeNull();
    expect(detail.end_time).toBeNull();
  });

  it('handles cross-day end_time (start near midnight)', () => {
    // 22:30 UTC = 00:30 local next day in Madrid CEST.
    const detail = composeOrderDetail({
      ...baseArgs,
      order: {
        ...baseOrder,
        appointment_date: '2026-05-10T22:30:00.000Z',
        timezone: 'Europe/Madrid',
      },
    });
    expect(detail.start_time).toBe('00:30');
    expect(detail.end_time).toBe('01:30');
  });
});
