import { describe, it, expect } from 'vitest';
import {
  STEP_FIELDS,
  validateStep,
  isStepComplete,
  firstInvalidStep,
  type StepValidationContext,
} from '../step-validation';
import type { ValidationMessages } from '../validate';
import { emptyAddress } from '@/shared/components/address-autocomplete';
import type { ServiceHireFormState } from '../../types';
import type { Question } from '@/shared/lib/questions';

const m: ValidationMessages = {
  addressRequired: 'addr',
  dateRequired: 'date',
  timeStartRequired: 'time',
  frequencyRequired: 'freq',
  weekdaysRequired: 'wd',
  dayOfMonthRequired: 'dom',
  termsRequired: 'terms',
  authRequired: 'auth',
  fieldRequired: 'field',
  billingCustomIncomplete: 'billing',
};

const baseState = (): ServiceHireFormState => ({
  address: {
    ...emptyAddress,
    street: 'Calle 1',
    raw_text: 'Calle 1, Madrid, Spain',
    country_code: 'es',
    city_name: 'Madrid',
  },
  scheduling: {
    schedule_type: 'once',
    start_date: '2026-06-01',
    time_start: '10:00',
  },
  answers: {},
  notes: '',
  terms_accepted: true,
  billing: { mode: 'same' },
});

const ctx = (
  over: Partial<StepValidationContext> = {},
): StepValidationContext => ({
  state: baseState(),
  questions: [],
  isAuthenticated: true,
  authChoice: 'guest',
  messages: m,
  ...over,
});

describe('STEP_FIELDS', () => {
  it('maps the 5 steps to their error keys', () => {
    expect(STEP_FIELDS[1]).toEqual(['address']);
    expect(STEP_FIELDS[2]).toEqual(['answers']);
    expect(STEP_FIELDS[3]).toEqual(['scheduling', 'billing']);
    expect(STEP_FIELDS[4]).toEqual(['auth']);
    expect(STEP_FIELDS[5]).toEqual(['terms']);
  });
});

describe('validateStep — step 1 (address)', () => {
  it('valid address ⇒ complete', () => {
    expect(validateStep(1, ctx())).toBeNull();
    expect(isStepComplete(1, ctx())).toBe(true);
  });

  it('missing address ⇒ step 1 error, other steps unaffected', () => {
    const c = ctx({ state: { ...baseState(), address: emptyAddress } });
    expect(validateStep(1, c)?.address).toBe('addr');
    expect(isStepComplete(1, c)).toBe(false);
  });

  it('does not leak the unauthenticated auth error into step 1', () => {
    const c = ctx({ isAuthenticated: false, authChoice: null });
    expect(validateStep(1, c)).toBeNull();
  });

  it('requireCityId off (Mapbox path) ⇒ city_id not demanded', () => {
    const s = baseState();
    s.address.city_id = null;
    expect(validateStep(1, ctx({ state: s }))).toBeNull();
  });

  it('requireCityId on + no city_id ⇒ step 1 address error', () => {
    const s = baseState();
    s.address.city_id = null;
    const c = ctx({ state: s, requireCityId: true });
    expect(validateStep(1, c)?.address).toBe('addr');
    expect(isStepComplete(1, c)).toBe(false);
  });

  it('requireCityId on + city_id present ⇒ step 1 complete', () => {
    const s = baseState();
    s.address.city_id = '11111111-1111-1111-1111-111111111111';
    expect(validateStep(1, ctx({ state: s, requireCityId: true }))).toBeNull();
  });
});

describe('validateStep — step 2 (answers)', () => {
  it('required question unanswered ⇒ step 2 invalid', () => {
    const q: Question = { key: 'tipo', type: 'text', required: true, i18n: {} };
    const c = ctx({ questions: [q] });
    expect(validateStep(2, c)?.answers?.tipo).toBe('field');
    expect(isStepComplete(2, c)).toBe(false);
  });

  it('optional question unanswered ⇒ step 2 complete', () => {
    const q: Question = { key: 'x', type: 'text', required: false, i18n: {} };
    expect(validateStep(2, ctx({ questions: [q] }))).toBeNull();
  });
});

describe('validateStep — step 3 (scheduling + billing)', () => {
  it('missing date ⇒ step 3 invalid', () => {
    const s = baseState();
    s.scheduling.start_date = '';
    expect(validateStep(3, ctx({ state: s }))?.scheduling?.start_date).toBe(
      'date',
    );
  });

  it('recurring weekly without weekdays ⇒ step 3 invalid', () => {
    const s = baseState();
    s.scheduling.schedule_type = 'recurring';
    s.scheduling.frequency = 'weekly';
    s.scheduling.weekdays = [];
    expect(validateStep(3, ctx({ state: s }))?.scheduling?.weekdays).toBe('wd');
    expect(isStepComplete(3, ctx({ state: s }))).toBe(false);
  });

  it('billing custom incomplete ⇒ step 3 invalid', () => {
    const s = baseState();
    s.billing = {
      mode: 'custom',
      data: { name: '', phone: '', fiscal_id_type_id: '', fiscal_id: '' },
    };
    expect(validateStep(3, ctx({ state: s }))?.billing).toBe('billing');
  });

  it('all scheduling + billing OK ⇒ step 3 complete', () => {
    expect(validateStep(3, ctx())).toBeNull();
  });
});

describe('validateStep — step 4 (auth)', () => {
  it('not authenticated ⇒ step 4 invalid', () => {
    const c = ctx({ isAuthenticated: false, authChoice: null });
    expect(validateStep(4, c)?.auth).toBe('auth');
    expect(isStepComplete(4, c)).toBe(false);
  });

  it('authenticated ⇒ step 4 complete', () => {
    expect(validateStep(4, ctx())).toBeNull();
  });
});

describe('validateStep — step 5 (conditional terms)', () => {
  it('guest without terms ⇒ step 5 invalid', () => {
    const s = baseState();
    s.terms_accepted = false;
    const c = ctx({ state: s, authChoice: 'guest' });
    expect(validateStep(5, c)?.terms).toBe('terms');
    expect(isStepComplete(5, c)).toBe(false);
  });

  it('signup without terms ⇒ step 5 invalid', () => {
    const s = baseState();
    s.terms_accepted = false;
    expect(validateStep(5, ctx({ state: s, authChoice: 'signup' }))?.terms).toBe(
      'terms',
    );
  });

  it('login without terms ⇒ step 5 complete (no checkbox shown)', () => {
    const s = baseState();
    s.terms_accepted = false;
    const c = ctx({ state: s, authChoice: 'login' });
    expect(validateStep(5, c)).toBeNull();
    expect(isStepComplete(5, c)).toBe(true);
  });

  it('guest with terms accepted ⇒ step 5 complete', () => {
    expect(validateStep(5, ctx({ authChoice: 'guest' }))).toBeNull();
  });
});

describe('firstInvalidStep', () => {
  it('fully valid authenticated guest ⇒ null', () => {
    expect(firstInvalidStep(ctx())).toBeNull();
  });

  it('returns the lowest invalid step', () => {
    const s = baseState();
    s.scheduling.start_date = ''; // step 3 broken
    const c = ctx({ state: s, isAuthenticated: false, authChoice: null });
    // step 3 (scheduling) and step 4 (auth) both broken ⇒ lowest = 3
    expect(firstInvalidStep(c)).toBe(3);
  });

  it('points at step 1 when address is missing', () => {
    const c = ctx({ state: { ...baseState(), address: emptyAddress } });
    expect(firstInvalidStep(c)).toBe(1);
  });
});
