import { redirect } from 'next/navigation';
import {
  getTranslations,
  unstable_setRequestLocale,
} from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSelectedCity,
  listCitiesForCountry,
} from '@/shared/lib/country/cookie-server';
import {
  AuthCard,
  RegisterForm,
  listActiveCountries,
  registerUser,
  computeRegisterPrefill,
  safeNext,
  type CountryOption,
} from '@/features/auth';

type Props = {
  params: { locale: string };
  searchParams: { next?: string };
};

// Register surface. Mirrors the login page structure:
// 1. Redirect-if-authed (G26) — already-signed-in visitors land on the
//    intended next path (or /mi-cuenta) instead of seeing the form.
// 2. Prefetch everything the form needs to avoid round trips when the
//    user changes country: active countries, all cities per active
//    country (citiesByCountry), and the cookie-resolved city for prefill.
// 3. computeRegisterPrefill (pure, tested) prefers countries that have
//    cities so the city select isn't dead-end empty (G17).
export default async function RegistroPage({
  params: { locale },
  searchParams,
}: Props) {
  unstable_setRequestLocale(locale);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nextPath = safeNext(searchParams.next, locale);
  if (user) {
    redirect(nextPath);
  }

  // Wave 1: countries + cookie city in parallel.
  const [countries, selected] = await Promise.all([
    listActiveCountries(locale),
    getSelectedCity(locale),
  ]);

  // Wave 2: cities for every active country in parallel — cached during
  // this request scope, so the form can resolve the city select for any
  // country switch without a server round trip.
  const cityLists = await Promise.all(
    countries.map((c) => listCitiesForCountry(c.id, locale)),
  );
  const citiesByCountry: Record<string, { id: string; name: string }[]> = {};
  countries.forEach((c, i) => {
    citiesByCountry[c.id] = cityLists[i].map((row) => ({
      id: row.id,
      name: row.name,
    }));
  });

  const countryOptions: CountryOption[] = countries.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
  }));
  const prefill = computeRegisterPrefill(
    selected,
    countryOptions,
    citiesByCountry,
  );

  const t = await getTranslations('Auth');

  return (
    <AuthCard title={t('register.title')} logoAlt={t('brand.logoAlt')}>
      <RegisterForm
        onSubmit={registerUser}
        locale={locale}
        countries={countryOptions}
        citiesByCountry={citiesByCountry}
        prefill={prefill}
      />
    </AuthCard>
  );
}
