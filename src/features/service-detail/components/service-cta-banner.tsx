type Props = {
  title: string;
  subtitle: string | null;
  hireLabel: string;
  offerLabel: string;
};

// CTA banner fed by the service hero_title / hero_subtitle. Same cream
// + decorative-shapes aesthetic as the marketing JoinCta. Buttons are
// intentionally inert (visible, no navigation) — there is no public
// hire/offer flow wired yet.
export function ServiceCtaBanner({
  title,
  subtitle,
  hireLabel,
  offerLabel,
}: Props) {
  return (
    <section
      className="relative overflow-hidden bg-brand-cream px-4 py-24 md:py-32"
      aria-label={title}
    >
      {/* Decorations */}
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

      <div className="relative z-[2] mx-auto max-w-[880px] text-center">
        <h2 className="m-0 mb-4 text-[1.8rem] font-bold leading-[1.35] text-brand-text md:text-[2.2rem]">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mb-9 max-w-[640px] text-base text-brand-text/75 md:text-lg">
            {subtitle}
          </p>
        )}
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:flex-wrap md:items-center md:justify-center">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="
              inline-flex w-full items-center justify-center
              rounded-full bg-brand-mustard px-7 py-3.5
              text-base font-semibold text-brand-text
              opacity-60 md:w-auto md:whitespace-nowrap
            "
          >
            {hireLabel}
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="
              inline-flex w-full items-center justify-center
              rounded-full border-2 border-brand-mustard bg-white px-7 py-3.5
              text-base font-semibold text-brand-text
              opacity-60 md:w-auto md:whitespace-nowrap
            "
          >
            {offerLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
