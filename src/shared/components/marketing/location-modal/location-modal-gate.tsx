'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { locales, type Locale } from '@/lib/i18n/config';
import { writeLocationCookieClient } from '@/shared/lib/country/cookie-client';
import { writeGeoAckCookieClient } from '@/shared/lib/country/geo-ack-client';

// Each locale renders its own native name (idiomatic UX, same as
// lang-switcher.tsx); language labels stay i18n-free here.
const LANG_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
  ca: 'Català',
};

type Country = { id: string; code: string; name: string };
type City = { id: string; countryId: string; name: string };

export type LocationModalLabels = {
  title: string;
  description: string;
  countryLabel: string;
  cityLabel: string;
  cityPlaceholder: string;
  languageLabel: string;
  confirm: string;
  skip: string;
  close: string;
  dialogAria: string;
};

type Props = {
  countries: Country[];
  cities: City[];
  initialCountryId: string;
  initialCityId: string;
  currentLocale: string;
  labels: LocationModalLabels;
};

// First-visit gate (client island). Mounted by PublicShell only when
// the ack cookie is absent, so it opens from the first paint (no
// useEffect-set-open → no flash). S2 = minimal functional UI; the
// responsive/branded Dialog is S3.
export function LocationModalGate({
  countries,
  cities,
  initialCountryId,
  initialCityId,
  currentLocale,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);
  const [countryId, setCountryId] = useState(initialCountryId);
  const [cityId, setCityId] = useState(initialCityId);
  const [locale, setLocale] = useState(currentLocale);

  // City is mandatory in the explicit flow → never offer a country
  // with no active city (would be a dead end: Confirm never enables).
  const countryOptions = countries.filter((c) =>
    cities.some((ci) => ci.countryId === c.id),
  );
  const cityOptions = cities.filter((ci) => ci.countryId === countryId);

  const ack = useCallback(() => {
    writeGeoAckCookieClient();
    setOpen(false);
  }, []);

  // Skip / close (X, Esc, backdrop): mark seen WITHOUT touching the
  // location cookie → resolver defaults stand. Refresh, never navigate.
  const skip = useCallback(() => {
    ack();
    router.refresh();
  }, [ack, router]);

  const confirm = () => {
    if (!countryId || !cityId) return;
    writeLocationCookieClient(cityId);
    ack();
    if (locale !== currentLocale) {
      const s = searchParams?.toString() ?? '';
      router.replace(s ? `${pathname}?${s}` : pathname, {
        locale: locale as Locale,
      });
    } else {
      router.refresh();
    }
  };

  const onCountryChange = (id: string) => {
    setCountryId(id);
    setCityId(''); // reset → Confirm disabled until a city is picked
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, skip]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.dialogAria}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={skip}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={skip}
          aria-label={labels.close}
          className="absolute right-3 top-3 text-xl leading-none text-brand-text"
        >
          ×
        </button>

        <h2 className="mb-2 text-lg font-bold text-brand-text">
          {labels.title}
        </h2>
        <p className="mb-4 text-sm text-brand-text/75">{labels.description}</p>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">{labels.countryLabel}</span>
          <select
            value={countryId}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            {countryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">{labels.cityLabel}</span>
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">{labels.cityPlaceholder}</option>
            {cityOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-5 block text-sm">
          <span className="mb-1 block font-medium">
            {labels.languageLabel}
          </span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={confirm}
            disabled={!countryId || !cityId}
            className="rounded bg-brand-mustard px-4 py-2 font-bold text-brand-text disabled:opacity-60"
          >
            {labels.confirm}
          </button>
          <button
            type="button"
            onClick={skip}
            className="rounded px-4 py-2 text-sm text-brand-text/75 underline"
          >
            {labels.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
