'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { writeLocationCookieClient } from '@/shared/lib/country/cookie-client';
import type { LocatorCityOption } from '@/shared/lib/country';

type Props = {
  cities: ReadonlyArray<LocatorCityOption>;
  currentCityId: string;
  searchLabel: string;
  searchAriaLabel: string;
};

// Client island for the locator dropdown. Writes the location cookie and
// triggers a soft refresh so RSCs re-render with the new selection. The
// surrounding form submit triggers the same refresh on the Busca CTA.
export function LocatorSelect({ cities, currentCityId, searchLabel, searchAriaLabel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const applyCity = (cityId: string) => {
    writeLocationCookieClient(cityId);
    startTransition(() => router.refresh());
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Submit re-emits the refresh; useful when the user picks a value
        // and then hits Enter rather than clicking the option directly.
        const formData = new FormData(e.currentTarget);
        const cityId = String(formData.get('city') ?? currentCityId);
        applyCity(cityId);
      }}
      className="flex items-center gap-2.5 w-full"
      role="search"
    >
      <select
        name="city"
        defaultValue={currentCityId}
        onChange={(e) => applyCity(e.target.value)}
        disabled={isPending}
        aria-label={searchAriaLabel}
        className="
          flex-1 min-w-[240px]
          bg-brand-cream text-brand-text
          border-0 rounded-full
          px-[18px] py-3.5 pr-9
          text-base font-medium
          appearance-none
          bg-no-repeat bg-[right_16px_center]
          [background-image:url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2214%22%20height=%2214%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23171F46%22%20stroke-width=%222.5%22%20stroke-linecap=%22round%22><path%20d=%22M6%209l6%206%206-6%22/></svg>')]
          focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-text
        "
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="
          inline-flex items-center justify-center
          bg-brand-mustard text-brand-text
          rounded-full
          px-7 py-3
          text-sm font-bold
          hover:bg-brand-mustard-deep
          transition-colors
          disabled:opacity-60
        "
      >
        {searchLabel}
      </button>
    </form>
  );
}
