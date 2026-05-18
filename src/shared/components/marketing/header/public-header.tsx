import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import type { SelectedCity } from '@/shared/lib/country';
import { listCitiesForCountry } from '@/shared/lib/country/cookie-server';
import { MobileMenu } from '../mobile-menu';
import { LangSwitcher } from '../lang-switcher';
import { SocialsRow } from './socials-row';
import { LocatorSelect } from '@/shared/components/marketing/locator-select';

type Props = {
  currentCity: SelectedCity | null;
  locale: string;
};

// Public header (RSC). Sticky white bar with logo + city locator + socials
// + lang switcher + Iniciar sesión. The locator-select is a Client island;
// everything else is server-rendered (zero JS shipped). When no city can
// be resolved (country with no active cities) the locator block is omitted.
export async function PublicHeader({ currentCity, locale }: Props) {
  const t = await getTranslations('nav');
  const cities = currentCity
    ? await listCitiesForCountry(currentCity.countryId, locale)
    : [];

  return (
    <header className="bg-white">
      <div className="mx-auto max-w-[1200px] flex items-center gap-4 px-4 py-3.5 lg:gap-6 lg:px-6 lg:py-4">
        <Link href="/" aria-label={t('homeAria')} className="flex-shrink-0">
          <Image
            src="/brand/logo.svg"
            alt="55+"
            width={120}
            height={45}
            priority
            className="h-10 w-auto block"
          />
        </Link>

        {/* Locator — hidden on mobile (burger menu surfaces it later in
            fase 1.1+). Omitted entirely when no city resolves. */}
        {currentCity && (
          <div className="hidden lg:flex flex-col gap-1 flex-1 max-w-[460px]">
            <label htmlFor="loc-select" className="text-sm font-medium text-brand-text whitespace-nowrap">
              {t('chooseLocation')}
            </label>
            <LocatorSelect
              cities={cities}
              currentCityId={currentCity.id}
              searchLabel={t('search')}
              searchAriaLabel={t('searchAria')}
            />
          </div>
        )}

        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <SocialsRow tone="dark" ariaLabel={t('socialsAria')} />
          <LangSwitcher tone="dark" align="right" />
          <Link
            href="/login"
            className="
              inline-flex items-center justify-center
              bg-brand-mustard text-brand-text
              rounded-full px-5 py-2.5
              text-sm font-bold
              hover:bg-brand-mustard-deep
              transition-colors
            "
          >
            {t('signIn')}
          </Link>
        </div>

        <MobileMenu
          ariaLabelOpen={t('menuAria')}
          ariaLabelClose={t('menuCloseAria')}
          brandAlt={t('homeAria')}
          socialsAriaLabel={t('socialsAria')}
          signInLabel={t('signIn')}
          signInHref="/login"
          links={[
            { key: 'home', href: '/', label: t('home') },
            { key: 'services', href: '/servicios', label: t('services') },
            { key: 'offer', href: '/ofrece', label: t('offer') },
            { key: 'about', href: '/sobre-55', label: t('about') },
          ]}
        />
      </div>
    </header>
  );
}
