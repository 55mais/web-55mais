import { getTranslations } from 'next-intl/server';
import { CtaBanner } from '@/shared/components/marketing/cta-banner';

export async function HomeJoinCta() {
  const t = await getTranslations('home.joinCta');

  return (
    <CtaBanner
      title={t('title')}
      buttons={[
        { label: t('ctaPrimary'), href: '/contratar', variant: 'mustard' },
        { label: t('ctaSecondary'), href: '/registro/talento', variant: 'outlined' },
      ]}
    />
  );
}
