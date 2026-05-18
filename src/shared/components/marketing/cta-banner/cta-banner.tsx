import { Link } from '@/lib/i18n/navigation';

export type CtaBannerButton = {
  label: string;
  variant: 'mustard' | 'outlined';
} & ({ href: string; disabled?: false } | { disabled: true });

export type CtaBannerProps = {
  title: string;
  subtitle?: string;
  /** Decorative shapes behind the content. Default true. */
  decorations?: boolean;
  buttons: CtaBannerButton[];
};

const VARIANTS = {
  mustard: 'bg-brand-mustard text-brand-text hover:bg-brand-mustard-deep',
  outlined:
    'bg-white text-brand-text border-2 border-brand-mustard hover:bg-brand-mustard',
} as const;

const BTN_BASE =
  'inline-flex items-center justify-center rounded-full px-7 py-3.5 ' +
  'text-base font-semibold transition-colors ' +
  'w-full md:w-auto md:whitespace-nowrap';

// Agnostic cream CTA banner: title + optional subtitle + N buttons
// (each a link or an inert/disabled control) + optional decorations.
// Zero i18n — callers inject localized strings.
export function CtaBanner({
  title,
  subtitle,
  decorations = true,
  buttons,
}: CtaBannerProps) {
  return (
    <section
      className="relative overflow-hidden bg-brand-cream px-4 py-24 md:py-32"
      aria-label={title}
    >
      {decorations && <Decorations />}

      <div className="relative z-[2] mx-auto max-w-[880px] text-center">
        <h2
          className={`m-0 ${
            subtitle ? 'mb-4' : 'mb-9'
          } text-[1.8rem] font-bold leading-[1.35] text-brand-text md:text-[2.2rem]`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mb-9 max-w-[640px] text-base text-brand-text/75 md:text-lg">
            {subtitle}
          </p>
        )}
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:flex-wrap md:items-center md:justify-center">
          {buttons.map((btn, i) =>
            'disabled' in btn && btn.disabled ? (
              <button
                key={i}
                type="button"
                disabled
                aria-disabled="true"
                className={`${BTN_BASE} opacity-60 ${VARIANTS[btn.variant]}`}
              >
                {btn.label}
              </button>
            ) : (
              <Link
                key={i}
                href={btn.href}
                className={`${BTN_BASE} ${VARIANTS[btn.variant]}`}
              >
                {btn.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function Decorations() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-0 top-5 left-[22%] h-16 w-7 bg-brand-coral md:top-14 md:left-1/4"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-0 top-7 right-[8%] h-8 w-20 bg-brand-blue md:top-16 md:right-6"
      />
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          top-1/2 -left-[90px] -translate-y-1/2
          h-[180px] w-[180px] rounded-full
          border-[36px] border-brand-blue-deep
          md:-left-[120px] md:h-[240px] md:w-[240px] md:border-[48px]
        "
      />
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          -bottom-[90px] -right-[80px]
          h-[200px] w-[200px] rounded-full
          border-[40px] border-brand-coral
          md:-bottom-[120px] md:-right-[100px] md:h-[260px] md:w-[260px] md:border-[52px]
        "
      />
    </>
  );
}
