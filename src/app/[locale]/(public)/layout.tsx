import type { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { getSelectedCity } from '@/shared/lib/country/cookie-server';
import { PublicHeader } from '@/shared/components/marketing/header';
import { PublicNavbar } from '@/shared/components/marketing/navbar';
import { NewsletterForm } from '@/shared/components/marketing/newsletter';
import { PublicFooter } from '@/shared/components/marketing/footer';
import { WhatsappFab } from '@/shared/components/marketing/whatsapp-fab';
import { JsonLdScript, organizationJsonLd } from '@/shared/lib/seo';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

// Public site layout (RSC). Every page under (public) renders inside the
// shared shell: Header + Navbar above, Newsletter + Footer + WhatsApp FAB
// below. font-mulish applied here so admin keeps font-sans.
export default async function PublicLayout({
  children,
  params: { locale },
}: Props) {
  unstable_setRequestLocale(locale);
  const currentCity = await getSelectedCity(locale);

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
      <NewsletterForm />
      <PublicFooter />
      <WhatsappFab />
    </div>
  );
}
