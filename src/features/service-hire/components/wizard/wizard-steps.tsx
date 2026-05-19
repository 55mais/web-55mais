'use client';

import { ServiceQuestionsRenderer } from '@/shared/components/question-renderers';
import type { ServiceForHire } from '../../actions/get-service-for-hire';
import type { FiscalIdTypeOption } from '../../actions/list-fiscal-id-types';
import type { ServiceHireFormState } from '../../types';
import type { ServiceHireErrors } from '../../lib/validate';
import type { ServiceHireHints } from '../../lib/build-hints';
import type { WizardStep } from '../../lib/step-validation';
import type { HireLocationOptions } from '../../lib/hire-location-types';
import { SchedulingBlock } from '../scheduling-block';
import { AuthGate, type AuthState } from '../auth-gate';
import { BillingChoiceFields } from '../billing-choice-fields';
import { StepOneLocation } from './step-one-location';

type Props = {
  step: WizardStep;
  service: ServiceForHire;
  locale: string;
  fiscalIdTypes: FiscalIdTypeOption[];
  form: ServiceHireFormState;
  onChange: (patch: Partial<ServiceHireFormState>) => void;
  authState: AuthState;
  onAuthenticated: (s: Extract<AuthState, { status: 'authenticated' }>) => void;
  authChoice: 'guest' | 'signup' | 'login' | null;
  errors: ServiceHireErrors | null;
  submitError: string | null;
  hints: ServiceHireHints;
  locationOptions: HireLocationOptions;
};

// Renders only the active step's fields. Reuses the existing,
// contract-stable sub-blocks redistributed across the 5 steps; the
// monolithic <textarea> notes field is intentionally not rendered
// (kept in state, sent as '' — see plan decision 3).
export function WizardSteps({
  step,
  service,
  locale,
  fiscalIdTypes,
  form,
  onChange,
  authState,
  onAuthenticated,
  authChoice,
  errors,
  submitError,
  hints,
  locationOptions,
}: Props) {
  if (step === 1) {
    return (
      <div className="space-y-1.5">
        <StepOneLocation
          address={form.address}
          onChange={(address) => onChange({ address })}
          options={locationOptions}
          locale={locale}
          hints={hints}
          hasError={Boolean(errors?.address)}
        />
        {errors?.address && (
          <p className="text-destructive text-xs">{errors.address}</p>
        )}
      </div>
    );
  }

  if (step === 2) {
    return (
      <ServiceQuestionsRenderer
        questions={service.questions}
        answers={form.answers}
        onChange={(v) => onChange({ answers: v })}
        errors={errors?.answers}
        locale={locale}
        assignedGroups={service.assignedGroups}
        hints={hints.questions}
      />
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <SchedulingBlock
          value={form.scheduling}
          onChange={(v) => onChange({ scheduling: v })}
          errors={errors?.scheduling}
          hints={hints.scheduling}
          timezone={
            form.address.country_code
              ? service.countryTimezones[
                  form.address.country_code.toLowerCase()
                ] ?? null
              : null
          }
        />
        <BillingChoiceFields
          value={form.billing}
          onChange={(v) => onChange({ billing: v })}
          fiscalIdTypes={fiscalIdTypes}
          hints={hints.billing}
        />
        {errors?.billing && (
          <p className="text-destructive text-xs">{errors.billing}</p>
        )}
      </div>
    );
  }

  if (step === 4) {
    return (
      <>
        <AuthGate
          authState={authState}
          onAuthenticated={onAuthenticated}
          fiscalIdTypes={fiscalIdTypes}
          hints={hints.auth}
        />
        {errors?.auth && (
          <p className="text-destructive text-xs">{errors.auth}</p>
        )}
      </>
    );
  }

  // Step 5 — confirmation. Terms are only shown for guest/signup; a
  // logged-in client already accepted them at registration, so the
  // wizard sets terms_accepted=true programmatically before submit.
  const showTerms = authChoice === 'guest' || authChoice === 'signup';

  return (
    <div className="space-y-4">
      {showTerms && (
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.terms_accepted}
              onChange={(e) => onChange({ terms_accepted: e.target.checked })}
              className="mt-1 h-4 w-4"
            />
            <span>{hints.termsLabel}</span>
          </label>
          {errors?.terms && (
            <p className="text-destructive text-xs">{errors.terms}</p>
          )}
        </div>
      )}
      {submitError && (
        <p className="text-destructive text-sm">{submitError}</p>
      )}
    </div>
  );
}
