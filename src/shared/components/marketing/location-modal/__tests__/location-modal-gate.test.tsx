import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const replace = vi.fn();
const refresh = vi.fn();
const writeLocation = vi.fn();
const writeAck = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}));
vi.mock('@/lib/i18n/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
  usePathname: () => '/servicios',
}));
vi.mock('@/shared/lib/country/cookie-client', () => ({
  writeLocationCookieClient: (id: string) => writeLocation(id),
}));
vi.mock('@/shared/lib/country/geo-ack-client', () => ({
  writeGeoAckCookieClient: () => writeAck(),
}));

import { LocationModalGate } from '../location-modal-gate';

const countries = [
  { id: 'es', code: 'ES', name: 'España' },
  { id: 'pt', code: 'PT', name: 'Portugal' },
  { id: 'fr', code: 'FR', name: 'Francia' }, // no active cities → filtered out
];
const cities = [
  { id: 'bcn', countryId: 'es', name: 'Barcelona' },
  { id: 'mad', countryId: 'es', name: 'Madrid' },
  { id: 'lis', countryId: 'pt', name: 'Lisboa' },
];
const labels = {
  title: 'Elige tu ubicación',
  description: 'Selecciona país, ciudad e idioma.',
  countryLabel: 'País',
  cityLabel: 'Ciudad',
  cityPlaceholder: '— Selecciona —',
  languageLabel: 'Idioma',
  confirm: 'Confirmar',
  skip: 'Continuar con España',
  close: 'Cerrar',
  dialogAria: 'Selección de ubicación e idioma',
};

function setup(over: Partial<Parameters<typeof LocationModalGate>[0]> = {}) {
  return render(
    <LocationModalGate
      countries={countries}
      cities={cities}
      initialCountryId="es"
      initialCityId="bcn"
      currentLocale="es"
      labels={labels}
      {...over}
    />,
  );
}

describe('LocationModalGate', () => {
  beforeEach(() => {
    replace.mockReset();
    refresh.mockReset();
    writeLocation.mockReset();
    writeAck.mockReset();
  });
  afterEach(() => cleanup());

  it('renders open from first paint as an aria-modal dialog', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', labels.dialogAria);
  });

  it('only lists countries that have ≥1 active city', () => {
    setup();
    const countrySelect = screen.getByLabelText(labels.countryLabel);
    const opts = Array.from(
      countrySelect.querySelectorAll('option'),
    ).map((o) => o.textContent);
    expect(opts).toEqual(['España', 'Portugal']); // Francia filtered
  });

  it('city options are filtered by the selected country', () => {
    setup();
    const citySelect = screen.getByLabelText(labels.cityLabel);
    const opts = Array.from(citySelect.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(opts).toEqual([labels.cityPlaceholder, 'Barcelona', 'Madrid']);
  });

  it('changing country resets the city and disables Confirm', () => {
    setup();
    fireEvent.change(screen.getByLabelText(labels.countryLabel), {
      target: { value: 'pt' },
    });
    const confirm = screen.getByRole('button', { name: labels.confirm });
    expect(confirm).toBeDisabled();
    const citySelect = screen.getByLabelText(
      labels.cityLabel,
    ) as HTMLSelectElement;
    expect(citySelect.value).toBe('');
    const opts = Array.from(citySelect.querySelectorAll('option')).map(
      (o) => o.textContent,
    );
    expect(opts).toEqual([labels.cityPlaceholder, 'Lisboa']);
  });

  it('Confirm is enabled with the initial country+city preselected', () => {
    setup();
    expect(
      screen.getByRole('button', { name: labels.confirm }),
    ).not.toBeDisabled();
  });

  it('Confirm with same locale → writes both cookies and refreshes', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: labels.confirm }));
    expect(writeLocation).toHaveBeenCalledWith('bcn');
    expect(writeAck).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('Confirm with a changed locale → navigates via i18n router (no refresh)', () => {
    setup();
    fireEvent.change(screen.getByLabelText(labels.languageLabel), {
      target: { value: 'en' },
    });
    fireEvent.click(screen.getByRole('button', { name: labels.confirm }));
    expect(writeLocation).toHaveBeenCalledWith('bcn');
    expect(writeAck).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/servicios', { locale: 'en' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('Skip writes ONLY the ack cookie and refreshes (no location cookie)', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: labels.skip }));
    expect(writeAck).toHaveBeenCalledTimes(1);
    expect(writeLocation).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('Esc closes the modal = skip (ack only)', () => {
    setup();
    // base-ui Dialog handles Escape via a document-level listener
    // (the realistic propagation path from the focused dialog).
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(writeAck).toHaveBeenCalledTimes(1);
    expect(writeLocation).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closing via the X button = skip (ack only)', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: labels.close }));
    expect(writeAck).toHaveBeenCalledTimes(1);
    expect(writeLocation).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
