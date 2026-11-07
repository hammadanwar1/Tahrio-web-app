// Single source of truth for brand/SEO constants.

export const site = {
  name: 'Tahrio',
  legalName: 'Tahrio',
  tagline: 'Original Gadgets, Better Life',
  // Static (no Date() during prerender under Cache Components).
  copyrightYear: 2026,
  /** Canonical origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tahrio.pk').replace(/\/$/, ''),
  locale: 'en_PK',
  language: 'en-PK',
  country: 'PK',
  currency: 'PKR',
  description:
    'Shop original mobile accessories in Pakistan — earbuds, phone cases, fast chargers, power banks, cables and smart watches. Cash on delivery nationwide, free delivery and 7-day easy returns.',
  keywords: [
    'mobile accessories in Pakistan',
    'phone accessories online Pakistan',
    'wireless earbuds price in Pakistan',
    'phone cases Pakistan',
    'fast charger price in Pakistan',
    'power bank price in Pakistan',
    'smart watch price in Pakistan',
    'cash on delivery Pakistan',
  ],
  // Published in Organization/LocalBusiness structured data. Social URLs are still PLACEHOLDERS.
  phone: '+92-332-6204600',
  whatsapp: '923326204600',
  email: 'sales@tahrio.pk',
  address: {
    addressLocality: 'Islamabad',
    addressRegion: 'Islamabad Capital Territory',
    addressCountry: 'PK',
  },
  social: {
    facebook: 'https://www.facebook.com/tahrio.pk',
    instagram: 'https://www.instagram.com/tahrio.pk',
    tiktok: 'https://www.tiktok.com/@tahrio.pk',
    youtube: 'https://www.youtube.com/@tahrio',
  },
  /** Store policies — used in copy, FAQ and Product/MerchantReturnPolicy structured data. */
  // Mirrors backend deliveryMethods: Standard free (2–3 days), Express Rs 250 (next day).
  policy: {
    standardDeliveryFee: 0,
    expressDeliveryFee: 250,
    deliveryDays: { min: 2, max: 3 },
    returnDays: 7,
  },
} as const;

export const absoluteUrl = (path = '/') => `${site.url}${path.startsWith('/') ? path : `/${path}`}`;
