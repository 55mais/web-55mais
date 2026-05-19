'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { emptyAddress } from '@/shared/components/address-autocomplete';
import type { ServiceForHire } from '../../actions/get-service-for-hire';
import type { FiscalIdTypeOption } from '../../actions/list-fiscal-id-types';
import { submitServiceHire } from '../../actions/submit-service-hire';
import { emptyScheduling, emptyBilling } from '../../types';
import type { ServiceHireFormState } from '../../types';
import type { ServiceHireErrors } from '../../lib/validate';
import type { ServiceHireHints } from '../../lib/build-hints';
import {
  validateStep,
  firstInvalidStep,
  type StepValidationContext,
  type WizardStep,
} from '../../lib/step-validation';
import { computeLocationPrefill } from '../../lib/location-prefill';
import type { HireLocationOptions } from '../../lib/hire-location-types';
import { type AuthState } from '../auth-gate';
import { StepHeader } from './step-header';
import { WizardFooter } from './wizard-footer';
import { WizardSteps } from './wizard-steps';

type Props = {
  service: ServiceForHire;
  locale: string;
  fiscalIdTypes: FiscalIdTypeOption[];
  hints: ServiceHireHints;
  locationOptions: HireLocationOptions;
  onClose: () => void;
};

// FormData = state JSON + file entries (file:{key}:{idx}); files are
// stripped from the JSON so the server only stores URLs after upload.
// Identical contract to the (now deleted) monolithic form.
function buildFormData(state: ServiceHireFormState, serviceId: string) {
  const fd = new FormData();
  const cleanAnswers: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state.answers)) {
    if (Array.isArray(value) && value.every((v) => v instanceof File)) {
      (value as File[]).forEach((f, i) => fd.append(`file:${key}:${i}`, f));
      cleanAnswers[key] = [];
    } else {
      cleanAnswers[key] = value;
    }
  }
  fd.append(
    'state',
    JSON.stringify({ ...state, serviceId, answers: cleanAnswers }),
  );
  return fd;
}

export function ServiceHireWizard({
  service,
  locale,
  fiscalIdTypes,
  hints,
  locationOptions,
  onClose,
}: Props) {
  const [step, setStep] = useState<WizardStep>(1);
  const [form, setForm] = useState<ServiceHireFormState>(() => {
    // Cookie-first prefill: País + Ciudad come from the selected city
    // (when it belongs to an active country), else first active country.
    const pf = computeLocationPrefill(
      locationOptions.selected,
      service.activeCountryCodes,
    );
    return {
      address: {
        ...emptyAddress,
        country_code: pf.countryCode,
        city_id: pf.cityId,
        city_name: pf.cityName,
      },
      scheduling: emptyScheduling,
      answers: {},
      notes: '',
      terms_accepted: false,
      billing: emptyBilling,
    };
  });
  const [authState, setAuthState] = useState<AuthState>({ status: 'idle' });
  const [errors, setErrors] = useState<ServiceHireErrors | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const isAuthenticated = authState.status === 'authenticated';
  const authChoice = isAuthenticated ? authState.choice : null;
  // login ⇒ T&C already accepted at registration; schema demands
  // literal(true), so the wizard sets it before validating/submitting.
  const effective: ServiceHireFormState =
    authChoice === 'login' ? { ...form, terms_accepted: true } : form;
  const ctx: StepValidationContext = {
    state: effective,
    questions: service.questions,
    isAuthenticated,
    authChoice,
    messages: hints.validation,
    // The wizard always renders the País/Ciudad selects, so the order
    // city must come from an authoritative cities.id.
    requireCityId: true,
  };

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const patch = (p: Partial<ServiceHireFormState>) => {
    setForm((s) => ({ ...s, ...p }));
    setErrors(null);
  };

  const handleNext = () => {
    const stepErrors = validateStep(step, ctx);
    if (stepErrors) {
      setErrors(stepErrors);
      headingRef.current?.focus();
      return;
    }
    setErrors(null);
    setStep((s) => (s + 1) as WizardStep);
  };

  const handleBack = () => {
    setErrors(null);
    setStep((s) => (s - 1) as WizardStep);
  };

  const handleConfirm = () => {
    setSubmitError(null);
    const invalid = firstInvalidStep(ctx);
    if (invalid !== null) {
      setStep(invalid);
      setErrors(validateStep(invalid, ctx));
      headingRef.current?.focus();
      return;
    }
    const fd = buildFormData(effective, service.id);
    startTransition(async () => {
      const result = await submitServiceHire(fd);
      if ('error' in result) {
        setSubmitError(result.error.message);
        return;
      }
      setSubmitted(true);
    });
  };

  if (submitted) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-6 text-center">
        <h2 className="text-xl font-semibold text-green-900">
          {hints.wizard.successTitle}
        </h2>
        <p className="mt-2 text-sm text-green-800">
          {hints.wizard.successBody}
        </p>
        <Button type="button" className="mt-4" onClick={onClose}>
          {hints.wizard.cancel}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <StepHeader ref={headingRef} step={step} hints={hints.wizard} />
      <WizardSteps
        step={step}
        service={service}
        locale={locale}
        fiscalIdTypes={fiscalIdTypes}
        form={form}
        onChange={patch}
        authState={authState}
        onAuthenticated={setAuthState}
        authChoice={authChoice}
        errors={errors}
        submitError={submitError}
        hints={hints}
        locationOptions={locationOptions}
      />
      <WizardFooter
        step={step}
        isPending={isPending}
        onCancel={onClose}
        onBack={handleBack}
        onNext={handleNext}
        onConfirm={handleConfirm}
        hints={hints.wizard}
      />
    </div>
  );
}
