import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import {
  addMinutesToIso,
  formatTimeInTz,
} from '@/shared/lib/datetime';
import type {
  OrderClientSummary,
  OrderDetail,
  OrderPaymentStatus,
  OrderSeriesStatus,
  OrderSeriesSummary,
  OrderTagOption,
  StaffMemberSummary,
} from '../types';
import type { OrderStatus, OrderScheduleType } from '../../types';

type OrderRow = {
  id: string;
  order_number: number;
  service_id: string | null;
  status: string;
  payment_status: string | null;
  appointment_date: string | null;
  schedule_type: string;
  timezone: string;
  price_total: number | string;
  price_subtotal: number | string;
  price_tax: number | string;
  price_tax_rate: number | string;
  currency: string;
  staff_member_id: string | null;
  client_id: string;
  talents_needed: number;
  created_at: string | null;
  updated_at: string | null;
};

type ServiceRow = { id: string; slug: string; i18n: unknown } | null;
type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
} | null;

type SeriesRow = {
  id: string;
  status: string;
  frequency: string;
  weekdays: number[] | null;
  day_of_month: number | null;
  repeat_every: number;
  time_start: string;
  time_end: string | null;
  hours_per_session: number | string | null;
  timezone: string;
  start_date: string;
  last_appointment_at: string | null;
  total_occurrences: number;
  occurrences_completed: number;
  occurrences_cancelled: number;
} | null;

const DEFAULT_DURATION_MIN = 60;

export function composeOrderDetail(args: {
  order: OrderRow;
  service: ServiceRow;
  client: ProfileRow;
  staffMember: ProfileRow;
  tags: OrderTagOption[];
  scheduleSummary: string;
  seriesRow: SeriesRow;
  sequenceNo: number | null;
  locale: string;
}): OrderDetail {
  const { order, service, client, staffMember, tags, scheduleSummary, seriesRow, sequenceNo, locale } = args;

  const startIso = order.appointment_date;
  const endIso = startIso ? addMinutesToIso(startIso, DEFAULT_DURATION_MIN) : null;

  return {
    id: order.id,
    order_number: order.order_number,
    service_id: order.service_id,
    service_name: service
      ? localizedField(service.i18n as I18nRecord, locale, 'name') ?? service.slug
      : null,
    status: order.status as OrderStatus,
    payment_status: (order.payment_status as OrderPaymentStatus | null) ?? null,
    appointment_date: order.appointment_date,
    schedule_type: order.schedule_type as OrderScheduleType,
    schedule_summary: scheduleSummary,
    timezone: order.timezone,
    estimated_duration_minutes: DEFAULT_DURATION_MIN,
    start_time: startIso ? formatTimeInTz(startIso, order.timezone) : null,
    end_time: endIso ? formatTimeInTz(endIso, order.timezone) : null,
    price_total: Number(order.price_total),
    price_subtotal: Number(order.price_subtotal),
    price_tax: Number(order.price_tax),
    price_tax_rate: Number(order.price_tax_rate),
    currency: order.currency,
    created_at: order.created_at,
    updated_at: order.updated_at,
    staff_member: composeStaff(staffMember),
    client: composeClient(client, order.client_id),
    tags,
    talents_needed: order.talents_needed ?? 1,
    series: composeSeries(seriesRow, sequenceNo),
  };
}

function composeSeries(row: SeriesRow, sequenceNo: number | null): OrderSeriesSummary | null {
  if (!row || sequenceNo === null) return null;
  return {
    id: row.id,
    sequence_no: sequenceNo,
    total_occurrences: row.total_occurrences,
    occurrences_completed: row.occurrences_completed,
    occurrences_cancelled: row.occurrences_cancelled,
    status: row.status as OrderSeriesStatus,
    frequency: row.frequency as 'weekly' | 'monthly',
    weekdays: row.weekdays,
    day_of_month: row.day_of_month,
    repeat_every: row.repeat_every,
    time_start: row.time_start,
    time_end: row.time_end,
    hours_per_session:
      row.hours_per_session === null ? null : Number(row.hours_per_session),
    start_date: row.start_date,
    timezone: row.timezone,
    last_appointment_at: row.last_appointment_at,
  };
}

function composeStaff(profile: ProfileRow): StaffMemberSummary | null {
  if (!profile) return null;
  return { id: profile.id, full_name: profile.full_name };
}

function composeClient(profile: ProfileRow, clientId: string): OrderClientSummary {
  return {
    id: clientId,
    full_name: profile?.full_name ?? null,
    email: profile?.email ?? null,
    phone: profile?.phone ?? null,
  };
}

