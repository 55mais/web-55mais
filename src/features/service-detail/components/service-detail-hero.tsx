import type { ReactNode } from 'react';
import Image from 'next/image';
import type { ServiceDetailPrice } from '../types';
import { ServicePrice } from './service-price';

type Props = {
  name: string;
  description: string | null;
  price: ServiceDetailPrice | null;
  imageUrl: string | null;
  ctaLabel: string;
  priceFromLabel: string;
  priceUnknownLabel: string;
  /** FAQ accordion, composed at the page layer (boundaries forbids
   *  features→features), rendered below the CTA. */
  faqSlot?: ReactNode;
};

// Asymmetric 2-column hero. CTA is intentionally inert (visible but
// disabled) — booking flow is out of scope for this page.
export function ServiceDetailHero({
  name,
  description,
  price,
  imageUrl,
  ctaLabel,
  priceFromLabel,
  priceUnknownLabel,
  faqSlot,
}: Props) {
  return (
    <section className="bg-white px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto grid max-w-[1200px] items-start gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
        <div>
          <h1 className="m-0 mb-3 text-3xl font-bold text-brand-text md:text-[2.6rem]">
            {name}
          </h1>
          {description && (
            <p className="mb-6 whitespace-pre-line text-lg text-brand-text/75">
              {description}
            </p>
          )}
          <div className="mb-6">
            <ServicePrice
              price={price}
              fromLabel={priceFromLabel}
              unknownLabel={priceUnknownLabel}
            />
          </div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="
              inline-flex items-center justify-center
              rounded-full bg-brand-mustard px-7 py-3.5
              text-base font-bold text-brand-text
              opacity-60
            "
          >
            {ctaLabel}
          </button>

          {faqSlot && <div className="mt-10 md:mt-12">{faqSlot}</div>}
        </div>

        {imageUrl && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
            <Image
              src={imageUrl}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 540px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
