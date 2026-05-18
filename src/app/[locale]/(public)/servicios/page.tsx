import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import { loadHomeServices } from '@/features/public-home/lib/load-home-services';
import { HomeServicesGrid } from '@/features/public-home/components/home-services-grid';
import { JoinCta } from '@/shared/components/marketing/join-cta';
import { LocatorSelect } from '@/shared/components/marketing/locator-select';
import { SuggestionCtaCard } from '@/features/service-suggestions';
import {
  getSelectedCity,
  listCitiesForCountry,
} from '@/shared/lib/country/cookie-server';
import { listActiveCountries } from '@/shared/lib/countries/list-active-countries';
import { listActiveCities } from '@/shared/lib/countries/list-active-cities';
import {
  buildPublicMetadata,
  JsonLdScript,
  serviceItemListJsonLd,
} from '@/shared/lib/seo';
import type { ServiceCategory } from '@/shared/lib/services/types';

type CategoryKey = 'all' | ServiceCategory;

type Props = {
  params: { locale: string };
  searchParams: { cat?: string; q?: string };
};

function normalizeCategory(raw: string | string[] | undefined): CategoryKey {
  const allowed: CategoryKey[] = [
    'all',
    'accompaniment',
    'classes',
    'repairs',
    'home',
  ];
  if (typeof raw !== 'string') return 'all';
  return (allowed as string[]).includes(raw) ? (raw as CategoryKey) : 'all';
}

function normalizeQuery(raw: string | string[] | undefined): string {
  return typeof raw === 'string' ? raw.slice(0, 100) : '';
}

export async function generateMetadata({ params: { locale } }: Props) {
  return buildPublicMetadata({
    locale,
    namespace: 'services.meta',
    path: '/servicios',
  });
}

export default async function ServicesPage({
  params: { locale },
  searchParams,
}: Props) {
  unstable_setRequestLocale(locale);
  const activeCategory = normalizeCategory(searchParams.cat);
  const initialQuery = normalizeQuery(searchParams.q);
  const city = await getSelectedCity(locale);
  const locatorCities = city
    ? await listCitiesForCountry(city.countryId, locale)
    : [];

  const [t, tNav, services, countries, cities] = await Promise.all([
    getTranslations('services'),
    getTranslations('nav'),
    loadHomeServices(locale, 'all'),
    listActiveCountries(locale),
    listActiveCities(locale),
  ]);

  const servicesJsonLd = serviceItemListJsonLd(
    services.map((s) => ({
      name: s.title,
      url: `/servicios/${s.slug}`,
    })),
  );

  return (
    <>
      <JsonLdScript id="ld-services-catalog" data={servicesJsonLd} />

      <div className="bg-white">
        <div className="h-[3px] bg-brand-red" />
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
          <div className="mb-10 text-center">
            <h1 className="m-0 mb-3 text-3xl font-bold text-brand-text md:text-[2.4rem]">
              {t('title')}
            </h1>
            {/* TODO: extract to <TitleUnderline> on second usage */}
            <svg
              aria-hidden="true"
              viewBox="0 0 220 16"
              className="mx-auto h-3 w-44 text-brand-red"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M3 11 Q 55 3, 110 9 T 217 8" />
            </svg>
          </div>

          <HomeServicesGrid
            services={services}
            initialCategory={activeCategory}
            basePath="/servicios"
            showViewAll={false}
            layout="grid"
            showSearch
            initialQuery={initialQuery}
            controlsSlot={
              city ? (
                <div className="flex max-w-[460px] flex-col gap-1">
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
              ) : undefined
            }
            gridCtaSlot={
              <SuggestionCtaCard
                title={t('suggestionCard.title')}
                body={t('suggestionCard.body')}
                buttonLabel={t('suggestionCard.button')}
                countries={countries}
                cities={cities}
              />
            }
          />
        </div>
      </div>

      <JoinCta
        title={t('cta.title')}
        buttons={[
          {
            label: t('cta.button'),
            href: '/registro/talento',
            variant: 'mustard',
          },
        ]}
      />
    </>
  );
}
