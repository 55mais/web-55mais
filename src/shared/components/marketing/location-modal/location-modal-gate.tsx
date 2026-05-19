'use client';

import { useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
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

const selectClass =
  'w-full rounded-lg border border-brand-text/20 bg-white px-3 py-2.5 text-base text-brand-text outline-none focus-visible:border-brand-mustard focus-visible:ring-2 focus-visible:ring-brand-mustard/40';

// First-visit gate (client island). Mounted by PublicShell only when
// the ack cookie is absent, so it opens from the first paint (no
// useEffect-set-open → no flash). Single responsive base-ui Dialog:
// bottom-sheet < md, centered modal ≥ md (no Sheet+Dialog combo).
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
  const countryRef = useRef<HTMLSelectElement>(null);
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

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) skip(); // Esc / backdrop = skip
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup
          aria-modal="true"
          aria-label={labels.dialogAria}
          initialFocus={countryRef as React.RefObject<HTMLElement | null>}
          className="group fixed inset-0 z-[100] flex items-end justify-center p-0 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 md:items-center md:p-4"
        >
          <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl transition-transform duration-200 group-data-[ending-style]:translate-y-full group-data-[starting-style]:translate-y-full md:max-w-md md:rounded-2xl md:transition-none md:group-data-[ending-style]:translate-y-0 md:group-data-[starting-style]:translate-y-0">
            <button
              type="button"
              onClick={skip}
              aria-label={labels.close}
              className="absolute right-3 top-3 text-2xl leading-none text-brand-text/60 transition-colors hover:text-brand-text"
            >
              ×
            </button>

            <h2 className="mb-1 pr-6 text-xl font-bold text-brand-text">
              {labels.title}
            </h2>
            <p className="mb-5 text-sm text-brand-text/70">
              {labels.description}
            </p>

            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block font-medium text-brand-text">
                {labels.countryLabel}
              </span>
              <select
                ref={countryRef}
                value={countryId}
                onChange={(e) => onCountryChange(e.target.value)}
                className={selectClass}
              >
                {countryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block font-medium text-brand-text">
                {labels.cityLabel}
              </span>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className={selectClass}
              >
                <option value="">{labels.cityPlaceholder}</option>
                {cityOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-6 block text-sm">
              <span className="mb-1.5 block font-medium text-brand-text">
                {labels.languageLabel}
              </span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className={selectClass}
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
                className="rounded-lg bg-brand-mustard px-4 py-2.5 font-bold text-brand-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {labels.confirm}
              </button>
              <button
                type="button"
                onClick={skip}
                className="rounded-lg px-4 py-2 text-sm text-brand-text/70 underline-offset-2 hover:underline"
              >
                {labels.skip}
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
