import { notFound } from 'next/navigation';
import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import {
  loadServiceDetail,
  ServiceDetailHero,
  ServiceDetailBenefits,
  ServiceCtaBanner,
} from '@/features/service-detail';
import { PublicFaqAccordion } from '@/features/faqs/components/public-faq-accordion';
import { HomeTestimonials } from '@/features/public-home/components/home-testimonials';
import { buildPublicMetadata, JsonLdScript, serviceJsonLd } from '@/shared/lib/seo';

type Props = {
  params: { locale: string; slug: string };
};

export async function generateMetadata({ params: { locale, slug } }: Props) {
  const svc = await loadServiceDetail(locale, slug);
  if (!svc) return {};
  const t = await getTranslations({ locale, namespace: 'serviceDetail.meta' });
  return buildPublicMetadata({
    locale,
    path: `/servicios/${slug}`,
    title: t('titleTemplate', { name: svc.name }),
    description: svc.description ?? t('descriptionFallback'),
    ogImage: svc.coverImageUrl ?? undefined,
  });
}

export default async function ServiceDetailPage({
  params: { locale, slug },
}: Props) {
  unstable_setRequestLocale(locale);
  const svc = await loadServiceDetail(locale, slug);
  if (!svc) notFound();

  const t = await getTranslations('serviceDetail');

  const jsonLd = serviceJsonLd({
    name: svc.name,
    description: svc.description ?? undefined,
    url: `/servicios/${svc.slug}`,
    imageUrl: svc.coverImageUrl ?? undefined,
    price: svc.price?.amount,
    priceCurrency: svc.price?.currency,
  });

  return (
    <>
      <JsonLdScript id="ld-service-detail" data={jsonLd} />

      <ServiceDetailHero
        name={svc.name}
        description={svc.description}
        price={svc.price}
        imageUrl={svc.coverImageUrl}
        ctaLabel={t('cta.reserve')}
        priceFromLabel={t('price.from')}
        priceUnknownLabel={t('price.unknown')}
        faqSlot={
          svc.faqs.length > 0 ? (
            <PublicFaqAccordion items={svc.faqs} />
          ) : undefined
        }
      />

      {(svc.benefits.length > 0 || svc.guarantees.length > 0) && (
        <ServiceDetailBenefits
          benefits={svc.benefits}
          guarantees={svc.guarantees}
          benefitsTitle={t('sections.benefits')}
          guaranteesTitle={t('sections.guarantees')}
        />
      )}

      {svc.heroTitle && (
        <ServiceCtaBanner
          title={svc.heroTitle}
          subtitle={svc.heroSubtitle}
          hireLabel={t('cta.hire')}
          offerLabel={t('cta.offer')}
        />
      )}

      <HomeTestimonials locale={locale} />
    </>
  );
}
