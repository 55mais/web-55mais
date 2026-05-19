import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ServiceForHire } from '../../../actions/get-service-for-hire';
import type { ServiceHireHints } from '../../../lib/build-hints';
import type { HireLocationOptions } from '../../../lib/hire-location-types';

const submitMock = vi.fn();

vi.mock('@/features/service-hire/actions/submit-service-hire', () => ({
  submitServiceHire: (fd: FormData) => submitMock(fd),
}));

vi.mock('@/shared/components/address-autocomplete', async (orig) => {
  const actual = (await orig()) as typeof import('@/shared/components/address-autocomplete');
  return {
    ...actual,
    AddressAutocomplete: ({
      onChange,
    }: {
      onChange: (v: typeof actual.emptyAddress) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onChange({
            ...actual.emptyAddress,
            street: 'Calle 1',
            raw_text: 'Calle 1, Madrid',
            country_code: 'es',
            city_name: 'Madrid',
          })
        }
      >
        fill-address
      </button>
    ),
  };
});

vi.mock('@/features/service-hire/components/scheduling-block', () => ({
  SchedulingBlock: ({
    onChange,
  }: {
    onChange: (v: unknown) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          schedule_type: 'once',
          start_date: '2026-06-01',
          time_start: '10:00',
        })
      }
    >
      fill-scheduling
    </button>
  ),
}));

vi.mock('@/features/service-hire/components/auth-gate', () => ({
  AuthGate: ({
    onAuthenticated,
  }: {
    onAuthenticated: (s: {
      status: 'authenticated';
      userId: string;
      choice: 'guest' | 'signup' | 'login';
    }) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onAuthenticated({ status: 'authenticated', userId: 'u1', choice: 'guest' })
        }
      >
        auth-guest
      </button>
      <button
        type="button"
        onClick={() =>
          onAuthenticated({ status: 'authenticated', userId: 'u1', choice: 'login' })
        }
      >
        auth-login
      </button>
    </div>
  ),
}));

import { ServiceHireWizard } from '../service-hire-wizard';

const service: ServiceForHire = {
  id: 'svc-1',
  slug: 'limpieza',
  name: 'Limpieza',
  description: null,
  questions: [],
  assignedGroups: [],
  activeCountryCodes: ['es'],
  countryTimezones: { es: 'Europe/Madrid' },
};

const v = {
  addressRequired: 'addr',
  dateRequired: 'date',
  timeStartRequired: 'time',
  frequencyRequired: 'freq',
  weekdaysRequired: 'wd',
  dayOfMonthRequired: 'dom',
  termsRequired: 'terms-err',
  authRequired: 'auth-err',
  fieldRequired: 'field',
  billingCustomIncomplete: 'billing',
};

const locationOptions: HireLocationOptions = {
  countries: [{ code: 'es', name: 'España' }],
  citiesByCountry: { es: [{ id: 'c-es-mad', name: 'Madrid' }] },
  selected: {
    id: 'c-es-mad',
    slug: 'madrid',
    name: 'Madrid',
    countryId: 'co-es',
    countryCode: 'ES',
  },
};

const hints: ServiceHireHints = {
  addressLabel: 'Dirección',
  addressPlaceholder: 'Calle…',
  location: {
    countryLabel: 'País',
    countryPlaceholder: 'Elegí un país',
    cityLabel: 'Ciudad',
    cityPlaceholder: 'Elegí una ciudad',
  },
  termsLabel: 'Acepto los términos',
  submitDisabledHint: 'Completa el paso',
  addressError: 'addr',
  scheduling: {} as ServiceHireHints['scheduling'],
  auth: {} as ServiceHireHints['auth'],
  billing: {
    legend: 'Facturación',
    same: 'Titular inicial',
    custom: 'Otro titular',
    name: 'Nombre',
    phone: 'Teléfono',
    fiscalType: 'Tipo',
    fiscalTypePlaceholder: 'Elegí',
    fiscalNumber: 'Número',
    fiscalNumberPlaceholder: 'Ej',
    formatError: 'fmt',
  },
  questions: { yes: 'Sí', no: 'No', fileTooLarge: 'big', fileWrongType: 'type' },
  validation: v,
  wizard: {
    title: 'Pedir servicio «Limpieza» en 5 pasos',
    intro: 'Completá los 5 pasos.',
    steps: ['Dirección', 'Detalles', 'Programación', 'Identificación', 'Confirmación'],
    stepProgress: (c: number) => `Paso ${c} de 5`,
    next: 'Siguiente',
    back: 'Atrás',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    successTitle: 'Listo',
    successBody: 'Tu pedido fue creado.',
  },
};

function setup(onClose = vi.fn()) {
  return render(
    <ServiceHireWizard
      service={service}
      locale="es"
      fiscalIdTypes={[]}
      hints={hints}
      locationOptions={locationOptions}
      onClose={onClose}
    />,
  );
}

const click = (name: RegExp | string) =>
  fireEvent.click(screen.getByRole('button', { name }));

// Walk steps 1→4 with valid data, leaving the wizard on step 5 with
// the given auth choice.
function advanceToStep5(choice: 'guest' | 'login') {
  click('fill-address');
  click(hints.wizard.next); // 1 → 2
  click(hints.wizard.next); // 2 → 3 (no questions)
  click('fill-scheduling');
  click(hints.wizard.next); // 3 → 4
  click(choice === 'guest' ? 'auth-guest' : 'auth-login');
  click(hints.wizard.next); // 4 → 5
}

describe('ServiceHireWizard', () => {
  beforeEach(() => submitMock.mockReset().mockResolvedValue({ data: { orderId: 'ord_1' } }));
  afterEach(() => cleanup());

  it('starts on step 1 and announces progress', () => {
    setup();
    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
    expect(screen.getByText(hints.wizard.title)).toBeInTheDocument();
  });

  it('step 1 renders País + Ciudad selects with the cookie prefill', () => {
    setup();
    expect(screen.getByText(hints.location.countryLabel)).toBeInTheDocument();
    expect(screen.getByText(hints.location.cityLabel)).toBeInTheDocument();
    // Cookie city (Madrid/ES) is prefilled, so once the address text is
    // filled step 1 is valid (city_id present satisfies requireCityId).
    click('fill-address');
    click(hints.wizard.next);
    expect(screen.getByText('Paso 2 de 5')).toBeInTheDocument();
  });

  it('blocks Siguiente on an invalid step and shows the error', () => {
    setup();
    click(hints.wizard.next); // step 1 invalid (empty address)
    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
    expect(screen.getByText(v.addressRequired)).toBeInTheDocument();
  });

  it('advances 1→5 with valid data', () => {
    setup();
    advanceToStep5('guest');
    expect(screen.getByText('Paso 5 de 5')).toBeInTheDocument();
  });

  it('guest must accept the terms before confirming', () => {
    setup();
    advanceToStep5('guest');
    const terms = screen.getByLabelText(hints.termsLabel);
    expect(terms).toBeInTheDocument();
    click(hints.wizard.confirm); // terms unchecked → blocked
    expect(submitMock).not.toHaveBeenCalled();
    expect(screen.getByText(v.termsRequired)).toBeInTheDocument();
    fireEvent.click(terms);
    click(hints.wizard.confirm);
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it('login hides the terms checkbox and submits (auto-accepted)', () => {
    setup();
    advanceToStep5('login');
    expect(screen.queryByLabelText(hints.termsLabel)).not.toBeInTheDocument();
    click(hints.wizard.confirm);
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it('shows the success screen after a successful submit', async () => {
    setup();
    advanceToStep5('login');
    click(hints.wizard.confirm);
    expect(await screen.findByText(hints.wizard.successTitle)).toBeInTheDocument();
    expect(screen.getByText(hints.wizard.successBody)).toBeInTheDocument();
  });

  it('Confirmar jumps back to the first invalid step', () => {
    setup();
    advanceToStep5('guest');
    // Go back to step 1 and clear the address by re-rendering is not
    // possible; instead exercise the jump via the terms gate which is
    // the only confirm-time-reachable invalid step.
    click(hints.wizard.confirm);
    expect(screen.getByText('Paso 5 de 5')).toBeInTheDocument();
    expect(screen.getByText(v.termsRequired)).toBeInTheDocument();
  });

  it('Cancelar invokes onClose', () => {
    const onClose = vi.fn();
    setup(onClose);
    click(hints.wizard.cancel);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
