import { unstable_setRequestLocale } from 'next-intl/server';
import { buildPublicMetadata, JsonLdScript, serviceItemListJsonLd } from '@/shared/lib/seo';
import { HomeHero } from '@/features/public-home/components/home-hero';
import { HomeServicesSection } from '@/features/public-home/components/home-services-section';
import { HomeHowtoTalents } from '@/features/public-home/components/home-howto-talents';
import { HomeHowtoClients } from '@/features/public-home/components/home-howto-clients';
import { HomeProject } from '@/features/public-home/components/home-project';
import { HomeTestimonials } from '@/features/public-home/components/home-testimonials';
import { HomeCtaBanner } from '@/features/public-home/components/home-cta-banner';
import { HomeCollaborators } from '@/features/public-home/components/home-collaborators';

type Category = 'all' | 'accompaniment' | 'classes' | 'repairs' | 'home';

function normalizeCategory(raw: string | string[] | undefined): Category {
  const allowed: Category[] = ['all', 'accompaniment', 'classes', 'repairs', 'home'];
  if (typeof raw !== 'string') return 'all';
  return (allowed as string[]).includes(raw) ? (raw as Category) : 'all';
}

type Props = {
  params: { locale: string };
  searchParams: { cat?: string };
};

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return buildPublicMetadata({ locale, namespace: 'home.meta', path: '/' });
}

export default async function PublicHomePage({ params: { locale }, searchParams }: Props) {
  unstable_setRequestLocale(locale);
  const activeCategory = normalizeCategory(searchParams.cat);

  const servicesJsonLd = serviceItemListJsonLd([
    { name: 'Experiencia Gastronómica', url: '/servicios/gastronomy' },
    { name: 'Chef en Casa', url: '/servicios/chef-home' },
    { name: 'Apoyo a mayores', url: '/servicios/elder-support' },
    { name: 'Limpieza del hogar', url: '/servicios/home-cleaning' },
    { name: 'Pequeñas reparaciones', url: '/servicios/small-repairs' },
    { name: 'Clases de cocina', url: '/servicios/cooking-class' },
  ]);

  return (
    <>
      <JsonLdScript id="ld-home-services" data={servicesJsonLd} />
      <HomeHero />
      <HomeServicesSection
        activeCategory={activeCategory}
        locale={locale}
      />
      <HomeHowtoTalents />
      <HomeHowtoClients />
      <HomeProject />
      <HomeTestimonials locale={locale} />
      <HomeCtaBanner />
      <HomeCollaborators />
    </>
  );
}
