import type { ReactNode } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';

type Props = {
  children: ReactNode;
  params: { locale: string };
};

// Minimal shell for the auth surface: full-viewport cream background,
// vertically and horizontally centered. Deliberately no header, nav
// or footer — the auth pages own the entire viewport so the user can
// focus on credentials only (matches the approved design).
export default function AuthLayout({ children, params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-10">
      <main className="w-full">{children}</main>
    </div>
  );
}
