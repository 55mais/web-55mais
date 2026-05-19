'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@/lib/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { registerSchema, type RegisterInput } from '../schemas';
import type { RegisterUserResult } from '../actions/register-user';
import type { CountryOption } from '../lib/register-prefill';
import { PasswordInput } from './password-input';

export type RegisterFormCity = { id: string; name: string };

type Props = {
  onSubmit: (input: unknown) => Promise<RegisterUserResult>;
  locale: string;
  countries: CountryOption[];
  citiesByCountry: Record<string, RegisterFormCity[]>;
  prefill: { countryId: string | null; cityId: string | null };
};

type ErrorReason =
  | 'email_already_registered'
  | 'weak_password'
  | 'invalid_email'
  | 'error';

const ERROR_KEY: Record<ErrorReason, string> = {
  email_already_registered: 'errorEmailRegistered',
  weak_password: 'errorWeakPassword',
  invalid_email: 'errorInvalidEmail',
  error: 'errorGeneric',
};

// Order in which the form's fields appear. Drives "focus first invalid"
// (G19) so the user lands on the topmost missing field rather than the
// alphabetical default RHF would pick.
const FIELD_ORDER: (keyof RegisterInput)[] = [
  'full_name',
  'phone',
  'preferred_country',
  'preferred_city',
  'email',
  'password',
];

const DOM_ID: Record<keyof RegisterInput, string> = {
  full_name: 'register-full-name',
  phone: 'register-phone',
  preferred_country: 'register-country',
  preferred_city: 'register-city',
  email: 'register-email',
  password: 'register-password',
};

export function RegisterForm({
  onSubmit,
  locale,
  countries,
  citiesByCountry,
  prefill,
}: Props) {
  const t = useTranslations('Auth.register');
  const [submitError, setSubmitError] = useState<ErrorReason | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      preferred_country: prefill.countryId ?? '',
      preferred_city: prefill.cityId ?? '',
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  const watchedCountry = form.watch('preferred_country');
  const cities = useMemo(
    () => citiesByCountry[watchedCountry] ?? [],
    [citiesByCountry, watchedCountry],
  );

  // Focus the topmost invalid field, falling back to full_name. Goes
  // through document.getElementById (same reason as login-form: base-ui's
  // ref composer doesn't reliably propagate the DOM node back through
  // Controller + RHF setFocus).
  const focusFirstInvalid = (
    errors: Partial<Record<keyof RegisterInput, unknown>> = {},
  ) => {
    if (typeof document === 'undefined') return;
    const first = FIELD_ORDER.find((k) => errors[k]) ?? 'full_name';
    document.getElementById(DOM_ID[first])?.focus();
  };

  const submit = (data: RegisterInput) => {
    setSubmitError(null);
    startTransition(async () => {
      const result = await onSubmit({ ...data, locale });
      if (result.ok) {
        setSuccessEmail(data.email);
        return;
      }
      setSubmitError(result.reason);
      // Email errors point the user at the email field; everything else
      // (weak password, generic) lands on the top invalid field.
      if (
        result.reason === 'email_already_registered' ||
        result.reason === 'invalid_email'
      ) {
        document.getElementById(DOM_ID.email)?.focus();
      } else if (result.reason === 'weak_password') {
        document.getElementById(DOM_ID.password)?.focus();
      }
    });
  };

  if (successEmail) {
    return (
      <div className="space-y-5 text-center">
        <h2 className="text-xl font-semibold text-brand-text">
          {t('successTitle')}
        </h2>
        <p className="text-sm text-brand-text/70">
          {t('successBody', { email: successEmail })}
        </p>
        <Link
          href="/login"
          className="inline-block font-semibold text-brand-coral hover:underline"
        >
          {t('successCta')}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit, (errors) =>
        focusFirstInvalid(errors as Record<keyof RegisterInput, unknown>),
      )}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor={DOM_ID.full_name}>{t('fullNameLabel')}</Label>
        <Controller
          control={form.control}
          name="full_name"
          render={({ field, fieldState }) => (
            <Input
              id={DOM_ID.full_name}
              autoComplete="name"
              placeholder={t('fullNamePlaceholder')}
              aria-invalid={Boolean(fieldState.error) || undefined}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={DOM_ID.phone}>{t('phoneLabel')}</Label>
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Input
              id={DOM_ID.phone}
              type="tel"
              autoComplete="tel"
              placeholder={t('phonePlaceholder')}
              aria-invalid={Boolean(fieldState.error) || undefined}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={DOM_ID.preferred_country}>{t('countryLabel')}</Label>
          <Controller
            control={form.control}
            name="preferred_country"
            render={({ field, fieldState }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v) => {
                  field.onChange(v);
                  // Reset city when the country changes so the form
                  // never carries a city that doesn't belong to the
                  // currently selected country.
                  form.setValue('preferred_city', '', {
                    shouldValidate: false,
                  });
                }}
              >
                <SelectTrigger
                  id={DOM_ID.preferred_country}
                  aria-invalid={Boolean(fieldState.error) || undefined}
                  className="w-full"
                >
                  <SelectValue placeholder={t('countryPlaceholder')}>
                    {(v: string) =>
                      countries.find((c) => c.id === v)?.name ??
                      t('countryPlaceholder')
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={DOM_ID.preferred_city}>{t('cityLabel')}</Label>
          <Controller
            control={form.control}
            name="preferred_city"
            render={({ field, fieldState }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v) => field.onChange(v)}
              >
                <SelectTrigger
                  id={DOM_ID.preferred_city}
                  disabled={cities.length === 0}
                  aria-invalid={Boolean(fieldState.error) || undefined}
                  className="w-full"
                >
                  <SelectValue placeholder={t('cityPlaceholder')}>
                    {(v: string) =>
                      cities.find((c) => c.id === v)?.name ??
                      t('cityPlaceholder')
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {cities.length === 0 && (
            <p className="text-xs text-brand-text/60">{t('cityEmptyHint')}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={DOM_ID.email}>{t('emailLabel')}</Label>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              id={DOM_ID.email}
              type="email"
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              aria-invalid={Boolean(fieldState.error) || undefined}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={DOM_ID.password}>{t('passwordLabel')}</Label>
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordInput
              id={DOM_ID.password}
              autoComplete="new-password"
              placeholder={t('passwordPlaceholder')}
              aria-invalid={Boolean(fieldState.error) || undefined}
              toggleLabels={{
                show: t('passwordToggleShow'),
                hide: t('passwordToggleHide'),
              }}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
            />
          )}
        />
        <p className="text-xs text-brand-text/60">{t('passwordHint')}</p>
      </div>

      {submitError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {t(ERROR_KEY[submitError])}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-brand-coral py-3 text-base font-semibold text-white hover:bg-brand-coral-deep"
      >
        {isPending ? t('submitting') : t('submit')}
      </Button>

      <p className="text-center text-sm text-brand-text/70">
        <Link
          href="/login"
          className="font-semibold text-brand-coral hover:underline"
        >
          {t('backToLogin')}
        </Link>
      </p>
    </form>
  );
}
