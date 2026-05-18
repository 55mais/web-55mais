import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
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
    </div>
  );
}
