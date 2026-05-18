// View types for the public service-detail page. Owned by this feature
// (no cross-feature imports — boundaries forbids features→features).

export type ServiceDetailPrice = {
  amount: number;
  currency: string; // countries.currency, e.g. 'EUR'
  source: 'city' | 'country';
};

export type ServiceDetailFaq = {
  id: string;
  question: string;
  answer: string;
};

export type ServiceDetailView = {
  id: string;
  slug: string;
  name: string; // localized, falls back to slug, never empty
  description: string | null; // shown under H1; also feeds metadata/JSON-LD
  includes: string | null;
  benefits: string[];
  guarantees: string[];
  faqs: ServiceDetailFaq[];
  coverImageUrl: string | null; // buildCoverPublicUrl(..., 'hero')
  price: ServiceDetailPrice | null;
};
