import {
  validateServiceHire,
  type ServiceHireErrors,
  type ValidationContext,
} from './validate';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export const TOTAL_STEPS = 5;

// Canonical step → ServiceHireErrors-key map. Doubles as the config
// (which fields live in which step) and the filter source for
// validateStep, so the wizard and the validator never diverge.
export const STEP_FIELDS: Record<WizardStep, (keyof ServiceHireErrors)[]> = {
  1: ['address'],
  2: ['answers'],
  3: ['scheduling', 'billing'],
  4: ['auth'],
  5: ['terms'],
};

export type StepValidationContext = ValidationContext & {
  // null until the user authenticates in step 4. Terms (step 5) are
  // only required for guest/signup; a logged-in client already
  // accepted T&C at registration, so the wizard auto-sets true.
  authChoice: 'guest' | 'signup' | 'login' | null;
};

// Per-step view over the single source of truth (validateServiceHire).
// We run the full validator once and project only the keys that belong
// to `step`, so step gating never contradicts the final submit guard.
// The unauthenticated `auth` error is naturally filtered out of steps
// 1-3 because those steps don't list 'auth' in STEP_FIELDS.
export function validateStep(
  step: WizardStep,
  ctx: StepValidationContext,
): ServiceHireErrors | null {
  const all = validateServiceHire(ctx);
  if (!all) return null;

  const out: ServiceHireErrors = {};
  for (const key of STEP_FIELDS[step]) {
    if (all[key] === undefined) continue;
    // Step 5 terms are conditional: only guest/signup must tick the
    // box. login (or not-yet-chosen) ⇒ no checkbox, so don't gate.
    if (
      key === 'terms' &&
      ctx.authChoice !== 'guest' &&
      ctx.authChoice !== 'signup'
    ) {
      continue;
    }
    out[key] = all[key] as never;
  }

  return Object.keys(out).length > 0 ? out : null;
}

export function isStepComplete(
  step: WizardStep,
  ctx: StepValidationContext,
): boolean {
  return validateStep(step, ctx) === null;
}

// Lowest step (1..5) that still has errors, or null when every step
// passes. Used by "Confirmar" to jump back to the first broken step.
export function firstInvalidStep(
  ctx: StepValidationContext,
): WizardStep | null {
  for (let step = 1 as WizardStep; step <= TOTAL_STEPS; step++) {
    if (!isStepComplete(step, ctx)) return step;
  }
  return null;
}
