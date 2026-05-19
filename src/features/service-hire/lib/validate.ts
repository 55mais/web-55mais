import { isAnswerMissing, type Question } from '@/shared/lib/questions';
import type { ServiceHireFormState } from '../types';

export type SchedulingErrors = {
  start_date?: string;
  time_start?: string;
  frequency?: string;
  weekdays?: string;
  day_of_month?: string;
};

export type ServiceHireErrors = {
  address?: string;
  scheduling?: SchedulingErrors;
  answers?: Record<string, string>;
  terms?: string;
  auth?: string;
  billing?: string;
};

export type ValidationMessages = {
  addressRequired: string;
  dateRequired: string;
  timeStartRequired: string;
  frequencyRequired: string;
  weekdaysRequired: string;
  dayOfMonthRequired: string;
  termsRequired: string;
  authRequired: string;
  fieldRequired: string;
  billingCustomIncomplete: string;
};

export type ValidationContext = {
  state: ServiceHireFormState;
  questions: Question[];
  isAuthenticated: boolean;
  messages: ValidationMessages;
  // When the País/Ciudad selects are present (wizard, S4+) the order's
  // city must come from an authoritative cities.id, so city_id is
  // required. Absent/false on the Mapbox-only path → resolved by slug
  // (no regression).
  requireCityId?: boolean;
};

export function validateServiceHire(ctx: ValidationContext): ServiceHireErrors | null {
  const { state, questions, isAuthenticated, messages: m } = ctx;
  const errors: ServiceHireErrors = {};

  // Address: needs at minimum a country_code to map to a country and a
  // raw_text. With selects (requireCityId) also an authoritative city_id.
  if (
    !state.address.country_code ||
    !state.address.raw_text.trim() ||
    (ctx.requireCityId && !state.address.city_id)
  ) {
    errors.address = m.addressRequired;
  }

  // Scheduling
  const schedErrors: SchedulingErrors = {};
  if (!state.scheduling.start_date) schedErrors.start_date = m.dateRequired;
  if (!state.scheduling.time_start) schedErrors.time_start = m.timeStartRequired;
  if (state.scheduling.schedule_type === 'recurring') {
    if (!state.scheduling.frequency) {
      schedErrors.frequency = m.frequencyRequired;
    } else if (
      state.scheduling.frequency === 'weekly' &&
      (!state.scheduling.weekdays || state.scheduling.weekdays.length === 0)
    ) {
      schedErrors.weekdays = m.weekdaysRequired;
    } else if (
      state.scheduling.frequency === 'monthly' &&
      !state.scheduling.day_of_month
    ) {
      schedErrors.day_of_month = m.dayOfMonthRequired;
    }
  }
  if (Object.keys(schedErrors).length > 0) errors.scheduling = schedErrors;

  // Answers: required questions
  const answerErrors: Record<string, string> = {};
  for (const q of questions) {
    if (isAnswerMissing(q, state.answers[q.key])) {
      answerErrors[q.key] = m.fieldRequired;
    }
  }
  if (Object.keys(answerErrors).length > 0) errors.answers = answerErrors;

  // Terms
  if (!state.terms_accepted) errors.terms = m.termsRequired;

  // Auth
  if (!isAuthenticated) errors.auth = m.authRequired;

  // Billing: when invoicing to a different party, all four custom fields must
  // be filled. The fiscal_id format check happens client-side in FiscalIdInput
  // and again server-side; here we only catch the "all empty" case.
  if (state.billing.mode === 'custom') {
    const b = state.billing.data;
    if (!b.name.trim() || !b.phone.trim() || !b.fiscal_id_type_id || !b.fiscal_id.trim()) {
      errors.billing = m.billingCustomIncomplete;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
