import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, string>) => {
    if (vars && 'email' in vars) return `${key}:${vars.email}`;
    return key;
  },
}));

vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

// Replace base-ui Select primitives with a single native <select> per
// instance. The trigger + content + items are JSX children of <Select>;
// we walk that tree to recover id/disabled/items so we can emit a
// fully-wired <select> without portals.
vi.mock('@/components/ui/select', () => {
  function SelectTrigger(_: {
    id?: string;
    disabled?: boolean;
    'aria-invalid'?: boolean;
    className?: string;
    children?: React.ReactNode;
  }) {
    return null;
  }
  function SelectValue(_: { placeholder?: string; children?: unknown }) {
    return null;
  }
  function SelectContent({ children: _children }: { children?: React.ReactNode }) {
    return null;
  }
  function SelectItem(_: { value: string; children?: React.ReactNode }) {
    return null;
  }

  function findChild<T>(
    children: React.ReactNode,
    typeMatch: (t: unknown) => boolean,
  ): React.ReactElement<T> | null {
    let out: React.ReactElement<T> | null = null;
    React.Children.forEach(children, (child) => {
      if (out || !React.isValidElement(child)) return;
      if (typeMatch(child.type)) {
        out = child as React.ReactElement<T>;
        return;
      }
      const props = child.props as { children?: React.ReactNode };
      if (props.children) {
        out = findChild<T>(props.children, typeMatch);
      }
    });
    return out;
  }

  function collectItems(
    children: React.ReactNode,
  ): { value: string; label: React.ReactNode }[] {
    const items: { value: string; label: React.ReactNode }[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === SelectItem) {
        const p = child.props as { value: string; children?: React.ReactNode };
        items.push({ value: p.value, label: p.children });
        return;
      }
      const props = child.props as { children?: React.ReactNode };
      if (props.children) {
        items.push(...collectItems(props.children));
      }
    });
    return items;
  }

  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (v: string) => void;
    children?: React.ReactNode;
  }) {
    const trigger = findChild<{
      id?: string;
      disabled?: boolean;
      'aria-invalid'?: boolean;
    }>(children, (t) => t === SelectTrigger);
    const items = collectItems(children);
    const triggerProps = (trigger?.props ?? {}) as {
      id?: string;
      disabled?: boolean;
      'aria-invalid'?: boolean;
    };
    return (
      <select
        id={triggerProps.id}
        disabled={triggerProps.disabled}
        aria-invalid={triggerProps['aria-invalid']}
        value={value ?? ''}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        <option value="" />
        {items.map((it) => (
          <option key={it.value} value={it.value}>
            {typeof it.label === 'string' ? it.label : it.value}
          </option>
        ))}
      </select>
    );
  }

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

import { RegisterForm } from '../register-form';
import type { RegisterUserResult } from '../../actions/register-user';

type Props = React.ComponentProps<typeof RegisterForm>;

// UUIDs because registerSchema enforces .uuid() on preferred_country
// and preferred_city. Using non-UUID slugs would silently fail validation
// and the form would never call onSubmit.
const UUID_ES = '11111111-1111-1111-1111-111111111111';
const UUID_PT = '22222222-2222-2222-2222-222222222222';
const UUID_FR = '33333333-3333-3333-3333-333333333333';
const UUID_MAD = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const UUID_LIS = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const countries = [
  { id: UUID_ES, code: 'es', name: 'España' },
  { id: UUID_PT, code: 'pt', name: 'Portugal' },
  { id: UUID_FR, code: 'fr', name: 'Francia' },
];

const citiesByCountry: Record<string, { id: string; name: string }[]> = {
  [UUID_ES]: [{ id: UUID_MAD, name: 'Madrid' }],
  [UUID_PT]: [{ id: UUID_LIS, name: 'Lisboa' }],
  [UUID_FR]: [],
};

function renderForm(overrides: Partial<Props> = {}) {
  const onSubmit = vi.fn<(input: unknown) => Promise<RegisterUserResult>>();
  const props: Props = {
    onSubmit,
    locale: 'es',
    countries,
    citiesByCountry,
    prefill: { countryId: UUID_ES, cityId: UUID_MAD },
    ...overrides,
  };
  const utils = render(<RegisterForm {...props} />);
  return { ...utils, onSubmit };
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText(/fullNameLabel/i), {
    target: { value: 'Ana López' },
  });
  fireEvent.change(screen.getByLabelText(/phoneLabel/i), {
    target: { value: '+34 600 000 000' },
  });
  fireEvent.change(screen.getByLabelText(/^emailLabel$/i), {
    target: { value: 'ana@example.com' },
  });
  fireEvent.change(
    document.getElementById('register-password') as HTMLInputElement,
    { target: { value: 'strong-secret-1' } },
  );
}

describe('RegisterForm', () => {
  afterEach(() => cleanup());

  it('renders all fields + register link + cityEmptyHint hidden when prefill has cities', () => {
    renderForm();
    expect(screen.getByLabelText(/fullNameLabel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phoneLabel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/countryLabel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cityLabel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^emailLabel$/i)).toBeInTheDocument();
    expect(document.getElementById('register-password')).not.toBeNull();
    expect(screen.getByRole('link', { name: /backToLogin/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.queryByText(/cityEmptyHint/i)).toBeNull();
  });

  it('honours the cookie prefill: country + city pre-selected', () => {
    renderForm();
    expect(
      (screen.getByLabelText(/countryLabel/i) as HTMLSelectElement).value,
    ).toBe(UUID_ES);
    expect(
      (screen.getByLabelText(/cityLabel/i) as HTMLSelectElement).value,
    ).toBe(UUID_MAD);
  });

  it('disables the city select + shows cityEmptyHint when country has no cities (G17)', () => {
    renderForm({ prefill: { countryId: UUID_FR, cityId: null } });
    expect(screen.getByLabelText(/cityLabel/i)).toBeDisabled();
    expect(screen.getByText(/cityEmptyHint/i)).toBeInTheDocument();
  });

  it('happy path: submits normalized email + locale, then renders success screen with email', async () => {
    const { onSubmit } = renderForm();
    onSubmit.mockResolvedValueOnce({ ok: true, data: { userId: 'u1' } });

    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith({
      full_name: 'Ana López',
      phone: '+34 600 000 000',
      preferred_country: UUID_ES,
      preferred_city: UUID_MAD,
      email: 'ana@example.com',
      password: 'strong-secret-1',
      locale: 'es',
    });
    expect(await screen.findByText(/successTitle/i)).toBeInTheDocument();
    expect(
      screen.getByText(/successBody:ana@example.com/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /successCta/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('email_already_registered: shows alert and focuses email (G23 + G19)', async () => {
    const { onSubmit } = renderForm();
    onSubmit.mockResolvedValueOnce({
      ok: false,
      reason: 'email_already_registered',
    });

    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('errorEmailRegistered');
    await waitFor(() => {
      expect(screen.getByLabelText(/^emailLabel$/i)).toHaveFocus();
    });
  });

  it('weak_password: shows alert and focuses password', async () => {
    const { onSubmit } = renderForm();
    onSubmit.mockResolvedValueOnce({ ok: false, reason: 'weak_password' });

    fillBasics();
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('errorWeakPassword');
    await waitFor(() => {
      expect(document.getElementById('register-password')).toHaveFocus();
    });
  });

  it('schema invalid (empty form): does not call onSubmit, focuses full_name', async () => {
    const { onSubmit } = renderForm({
      prefill: { countryId: null, cityId: null },
    });
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/fullNameLabel/i)).toHaveFocus();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('changing country resets the city selection (so stale city never submits)', async () => {
    const { onSubmit } = renderForm();

    fireEvent.change(screen.getByLabelText(/countryLabel/i), {
      target: { value: UUID_PT },
    });

    fillBasics();
    fireEvent.change(screen.getByLabelText(/cityLabel/i), {
      target: { value: UUID_LIS },
    });

    onSubmit.mockResolvedValueOnce({ ok: true, data: { userId: 'u1' } });
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        preferred_country: UUID_PT,
        preferred_city: UUID_LIS,
      }),
    );
  });
});
