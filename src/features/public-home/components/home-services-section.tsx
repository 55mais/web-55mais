import { getTranslations } from 'next-intl/server';
import type { ServiceCategory } from '@/shared/lib/services/types';
import { LocatorSelect } from '@/shared/components/marketing/locator-select';
import {
  getSelectedCity,
  listCitiesForCountry,
} from '@/shared/lib/country/cookie-server';
import { loadHomeServices } from '../lib/load-home-services';
import { HomeServicesGrid } from './home-services-grid';

type CategoryKey = 'all' | ServiceCategory;

type Props = {
  /** Active filter from ?cat=... searchParam. Default 'all'. Only used
   *  for the FIRST render — subsequent filter clicks are client-only. */
  activeCategory: CategoryKey;
  /** Current request locale — used to pick localized name/benefits. */
  locale: string;
};

export async function HomeServicesSection({ activeCategory, locale }: Props) {
  const [t, tNav, services] = await Promise.all([
    getTranslations('home.services'),
    getTranslations('nav'),
    loadHomeServices(locale, 'all'),
  ]);
  const city = await getSelectedCity(locale);
  const locatorCities = city
    ? await listCitiesForCountry(city.countryId, locale)
    : [];

  return (
    <section id="services" className="bg-white px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mb-5 text-center text-2xl font-bold text-brand-text md:mb-7 md:text-[2rem]">
          {t('sectionTitle')}
        </h2>

        {city && (
          <div className="mb-5 flex max-w-[460px] flex-col gap-1">
            <p className="text-sm font-medium text-brand-text">
              {tNav('chooseLocation')}
            </p>
            <LocatorSelect
              cities={locatorCities}
              currentCityId={city.id}
              searchLabel={tNav('search')}
              searchAriaLabel={tNav('searchAria')}
            />
          </div>
        )}

        <HomeServicesGrid
          services={services}
          initialCategory={activeCategory}
          basePath="/"
          showViewAll
          layout="carousel"
          showSearch={false}
        />
      </div>
    </section>
  );
}
