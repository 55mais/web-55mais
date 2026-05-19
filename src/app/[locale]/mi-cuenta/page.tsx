import { redirect } from 'next/navigation';
import {
  getTranslations,
  unstable_setRequestLocale,
} from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: { locale: string } };

// Personal area placeholder. Gated: anonymous visitors are bounced to
// /login with a `next` hint so they return here after signing in. The
// page itself is intentionally bare — design comes later (see plan).
export default async function MiCuentaPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // The middleware refreshes sessions on every request, so a null
    // user here is a real unauth state. `next` is a fully-qualified
    // localized path so it round-trips through safeNext after login.
    redirect(`/${locale}/login?next=/${locale}/mi-cuenta`);
  }

  const t = await getTranslations('Auth.account');

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    '';

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-10 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-text">
        {t('welcome', { name: displayName })}
      </h1>
      <p className="mt-4 text-sm text-brand-text/70">{t('placeholder')}</p>
    </div>
  );
}
