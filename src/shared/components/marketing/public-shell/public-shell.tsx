import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
import { hasGeoAck } from '@/shared/lib/country/geo-ack-server';
import { listActiveCountries } from '@/shared/lib/countries/list-active-countries';
import { listActiveCities } from '@/shared/lib/countries/list-active-cities';
import { LocationModalGate } from '@/shared/components/marketing/location-modal';
import { PublicHeader } from '@/shared/components/marketing/header';
import { PublicNavbar } from '@/shared/components/marketing/navbar';
import { NewsletterForm } from '@/shared/components/marketing/newsletter';
import { PublicFooter } from '@/shared/components/marketing/footer';
import { WhatsappFab } from '@/shared/components/marketing/whatsapp-fab';
import { JsonLdScript, organizationJsonLd } from '@/shared/lib/seo';

type Props = {
  children: ReactNode;
  locale: string;
  /** Render the newsletter band between content and footer. Off for
   *  routes that supply their own closing CTA (e.g. service detail). */
  showNewsletter?: boolean;
};

// First-visit gate: rendered only when the ack cookie is absent AND a
// city is resolvable (no countries/cities → degrade silently, same as
// the header hiding the locator). Importing the island lazily here
// keeps its JS off return-visit pages (ack present → null).
async function buildLocationGate(locale: string) {
  const currentCity = await getSelectedCity(locale);
  if (hasGeoAck() || currentCity === null) return null;

  const [countries, cities, tm] = await Promise.all([
    listActiveCountries(locale),
    listActiveCities(locale),
    getTranslations('LocationModal'),
  ]);
  const resolvedName =
    countries.find((c) => c.id === currentCity.countryId)?.name ??
    currentCity.name;

  return (
    <LocationModalGate
      countries={countries}
      cities={cities}
      initialCountryId={currentCity.countryId}
      initialCityId={currentCity.id}
      currentLocale={locale}
      labels={{
        title: tm('title'),
        description: tm('description'),
        countryLabel: tm('countryLabel'),
        cityLabel: tm('cityLabel'),
        cityPlaceholder: tm('cityPlaceholder'),
        languageLabel: tm('languageLabel'),
        confirm: tm('confirm'),
        skip: tm('skip', { country: resolvedName }),
        close: tm('close'),
        dialogAria: tm('dialogAria'),
      }}
    />
  );
}

// Shared public site shell (RSC): Header + Navbar above, optional
// Newsletter + Footer + WhatsApp FAB below. font-mulish applied here so
// admin keeps font-sans.
export async function PublicShell({
  children,
  locale,
  showNewsletter = true,
}: Props) {
  const currentCity = await getSelectedCity(locale);
  const tn = showNewsletter ? await getTranslations('newsletter') : null;
  const locationGate = await buildLocationGate(locale);

  return (
    <div className="overflow-x-clip font-mulish text-brand-text">
      <JsonLdScript id="ld-org" data={organizationJsonLd()} />
      {/* Header + navbar travel together as one sticky block. Wrapping
          them keeps the red strip pinned with the white bar on scroll;
          the parent uses overflow-x-clip (not -hidden) so position:
          sticky still resolves against the viewport. */}
      <div className="sticky top-0 z-50">
        <PublicHeader currentCity={currentCity} locale={locale} />
        <PublicNavbar />
      </div>
      <main>{children}</main>
      {tn && (
        <NewsletterForm
          title={tn('title')}
          lead={tn('lead')}
          placeholder={tn('placeholder')}
          emailLabel={tn('emailLabel')}
          submitLabel={tn('submit')}
          formAria={tn('formAria')}
        />
      )}
      <PublicFooter />
      <WhatsappFab />
      {locationGate}
    </div>
  );
}
