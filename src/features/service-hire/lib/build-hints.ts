import type { useTranslations } from 'next-intl';
import type { ValidationMessages } from './validate';

// The global (non-namespaced) translator. Both real callers (admin
// test-page now, hire-launcher in S5) are client components, so we
// type against useTranslations and prefix every key with the
// `ServiceHire.` namespace. Keeps build-hints the single place that
// knows the namespace, so the wizard stays i18n-free.
export type ServiceHireTranslator = ReturnType<typeof useTranslations>;

type SchedulingHints = {
  title: string;
  scheduleType: string;
  once: string;
  recurring: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  frequency: string;
  weekly: string;
  monthly: string;
  weekdays: string;
  dayOfMonth: string;
  endDate: string;
  localTimeNote: string;
};

type GuestDataHints = {
  title: string;
  name: string;
  email: string;
  phone: string;
  fiscalType: string;
  fiscalTypePlaceholder: string;
  fiscalNumber: string;
  fiscalNumberPlaceholder: string;
  formatError: string;
  emailRegistered: string;
  submit: string;
  error: string;
};

type AuthHints = {
  title: string;
  guest: string;
  signup: string;
  login: string;
  signupName: string;
  signupEmail: string;
  signupPassword: string;
  signupPhone: string;
  signupConfirm: string;
  loginEmail: string;
  loginPassword: string;
  loginConfirm: string;
  authenticatedAs: string;
  asGuest: string;
  error: string;
  emailAlreadyRegistered: string;
  fiscalType: string;
  fiscalTypePlaceholder: string;
  fiscalNumber: string;
  fiscalNumberPlaceholder: string;
  fiscalFormatError: string;
  guestData: GuestDataHints;
};

type BillingHints = {
  legend: string;
  same: string;
  custom: string;
  name: string;
  phone: string;
  fiscalType: string;
  fiscalTypePlaceholder: string;
  fiscalNumber: string;
  fiscalNumberPlaceholder: string;
  formatError: string;
};

type WizardHints = {
  title: string;
  intro: string;
  steps: [string, string, string, string, string];
  stepProgress: (current: number) => string; // "Paso {current} de {total}"
  next: string;
  back: string;
  cancel: string;
  confirm: string;
  successTitle: string;
  successBody: string;
};

type LocationHints = {
  countryLabel: string;
  countryPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
};

export type ServiceHireHints = {
  addressLabel: string;
  addressPlaceholder: string;
  location: LocationHints;
  termsLabel: string;
  submitDisabledHint: string;
  addressError: string;
  scheduling: SchedulingHints;
  auth: AuthHints;
  billing: BillingHints;
  questions: { yes: string; no: string; fileTooLarge: string; fileWrongType: string };
  validation: ValidationMessages;
  wizard: WizardHints;
};

// Single construction of the ServiceHire hints tree. Extracted from
// the admin test-page so the wizard and the future hire-launcher
// don't each hand-roll ~80 lines of t() calls.
export function buildServiceHireHints(
  t: ServiceHireTranslator,
  serviceName: string,
): ServiceHireHints {
  const g = (key: string, values?: Record<string, string | number>) =>
    t(`ServiceHire.${key}` as never, values as never);

  return {
    addressLabel: g('addressLabel'),
    addressPlaceholder: g('addressPlaceholder'),
    location: {
      countryLabel: g('countryLabel'),
      countryPlaceholder: g('countryPlaceholder'),
      cityLabel: g('cityLabel'),
      cityPlaceholder: g('cityPlaceholder'),
    },
    termsLabel: g('termsLabel'),
    submitDisabledHint: g('submitDisabledHint'),
    addressError: g('validationAddressRequired'),
    scheduling: {
      title: g('schedulingTitle'),
      scheduleType: g('scheduleType'),
      once: g('once'),
      recurring: g('recurring'),
      date: g('date'),
      timeStart: g('timeStart'),
      timeEnd: g('timeEnd'),
      frequency: g('frequency'),
      weekly: g('weekly'),
      monthly: g('monthly'),
      weekdays: g('weekdays'),
      dayOfMonth: g('dayOfMonth'),
      endDate: g('endDate'),
      localTimeNote: g('localTimeNote'),
    },
    auth: {
      title: g('authTitle'),
      guest: g('authGuest'),
      signup: g('authSignup'),
      login: g('authLogin'),
      signupName: g('authSignupName'),
      signupEmail: g('authSignupEmail'),
      signupPassword: g('authSignupPassword'),
      signupPhone: g('authSignupPhone'),
      signupConfirm: g('authSignupConfirm'),
      loginEmail: g('authLoginEmail'),
      loginPassword: g('authLoginPassword'),
      loginConfirm: g('authLoginConfirm'),
      authenticatedAs: g('authAuthenticatedAs'),
      asGuest: g('authAsGuest'),
      error: g('authError'),
      emailAlreadyRegistered: g('emailAlreadyRegistered'),
      fiscalType: g('fiscalType'),
      fiscalTypePlaceholder: g('fiscalTypePlaceholder'),
      fiscalNumber: g('fiscalNumber'),
      fiscalNumberPlaceholder: g('fiscalNumberPlaceholder'),
      fiscalFormatError: g('fiscalFormatError'),
      guestData: {
        title: g('guestDataTitle'),
        name: g('guestDataName'),
        email: g('guestDataEmail'),
        phone: g('guestDataPhone'),
        fiscalType: g('fiscalType'),
        fiscalTypePlaceholder: g('fiscalTypePlaceholder'),
        fiscalNumber: g('fiscalNumber'),
        fiscalNumberPlaceholder: g('fiscalNumberPlaceholder'),
        formatError: g('fiscalFormatError'),
        emailRegistered: g('emailAlreadyRegistered'),
        submit: g('guestDataSubmit'),
        error: g('authError'),
      },
    },
    billing: {
      legend: g('billingLegend'),
      same: g('billingToInitial'),
      custom: g('billingToOther'),
      name: g('billingName'),
      phone: g('billingPhone'),
      fiscalType: g('fiscalType'),
      fiscalTypePlaceholder: g('fiscalTypePlaceholder'),
      fiscalNumber: g('fiscalNumber'),
      fiscalNumberPlaceholder: g('fiscalNumberPlaceholder'),
      formatError: g('fiscalFormatError'),
    },
    questions: {
      yes: g('yes'),
      no: g('no'),
      fileTooLarge: g('fileTooLarge'),
      fileWrongType: g('fileWrongType'),
    },
    validation: {
      addressRequired: g('validationAddressRequired'),
      dateRequired: g('validationDateRequired'),
      timeStartRequired: g('validationTimeStartRequired'),
      frequencyRequired: g('validationFrequencyRequired'),
      weekdaysRequired: g('validationWeekdaysRequired'),
      dayOfMonthRequired: g('validationDayOfMonthRequired'),
      termsRequired: g('validationTermsRequired'),
      authRequired: g('validationAuthRequired'),
      fieldRequired: g('validationFieldRequired'),
      billingCustomIncomplete: g('validationBillingCustomIncomplete'),
    },
    wizard: {
      title: g('wizardTitle', { name: serviceName }),
      intro: g('wizardIntro'),
      steps: [
        g('step1'),
        g('step2'),
        g('step3'),
        g('step4'),
        g('step5'),
      ],
      stepProgress: (current: number) =>
        g('stepProgress', { current, total: 5 }),
      next: g('next'),
      back: g('back'),
      cancel: g('cancel'),
      confirm: g('confirm'),
      successTitle: g('successTitle'),
      successBody: g('successBody'),
    },
  };
}
