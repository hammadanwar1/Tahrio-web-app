// Buying guides (SEO content). Each targets a high-intent Pakistani search query and links
// to relevant collections/products (internal linking). Product links use product IDs and are
// resolved to current slugs at render time.

export interface PostSection {
  heading: string;
  body: string[];
  /** Product IDs to feature under this section. */
  products?: string[];
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  /** Primary keyword the post targets. */
  keyword: string;
  date: string;
  updated?: string;
  author: string;
  categoryId: string;
  intro: string;
  sections: PostSection[];
}

export const posts: Post[] = [
  {
    slug: 'best-wireless-earbuds-under-7000-in-pakistan',
    title: 'Best Wireless Earbuds Under Rs 7,000 in Pakistan (2026 Guide)',
    description:
      'Our pick of the best wireless earbuds under Rs 7,000 in Pakistan for ANC, gaming, gym and calls — with battery life, latency and price compared.',
    keyword: 'best earbuds under 7000 in Pakistan',
    date: '2026-09-20',
    updated: '2026-10-10',
    author: 'Tahrio Team',
    categoryId: 'earbuds',
    intro:
      'Good earbuds no longer cost Rs 20,000. Under Rs 7,000 you can get active noise cancellation, low-latency gaming modes and all-day battery. Here is how to choose, and the pairs we recommend.',
    sections: [
      {
        heading: 'What to look for',
        body: [
          'Battery: look for at least 6 hours per charge and 20+ hours with the case. Noise cancellation: real ANC uses microphones to cancel engine and traffic noise — useful on rickshaws, buses and flights. Latency: for PUBG and Free Fire, choose a pair with a dedicated gaming mode under 60 ms.',
          'Also check for IPX4 or higher sweat resistance if you train, and a USB-C case so you can share your phone charger.',
        ],
      },
      {
        heading: 'Best overall: Tahrio Pods Pro ANC',
        body: ['Active noise cancellation, 30 hours of total playtime and a low-latency mode, at a sale price under Rs 6,500.'],
        products: ['p-pods-pro-anc'],
      },
      {
        heading: 'Best for gaming: Tahrio Gaming Buds',
        body: ['A 45 ms gaming mode keeps footsteps and gunshots in sync, and dual mics make squad voice chat clear.'],
        products: ['p-gaming-buds'],
      },
      {
        heading: 'Best budget picks',
        body: ['Tahrio Buds Lite cover daily listening for under Rs 2,500, and the Bass Neckband is the battery champion at 24 hours.'],
        products: ['p-buds-lite', 'p-bass-neckband'],
      },
    ],
  },
  {
    slug: 'how-to-choose-a-fast-charger-for-iphone-and-android',
    title: 'How to Choose a Fast Charger for iPhone & Android in Pakistan',
    description:
      'PD, GaN, 20W or 65W? A simple guide to buying a safe fast charger for iPhone and Samsung in Pakistan — and the cables that actually support fast charging.',
    keyword: 'fast charger for iPhone Pakistan',
    date: '2026-09-28',
    author: 'Tahrio Team',
    categoryId: 'chargers',
    intro:
      'Fast charging depends on three things working together: the charger, the cable and your phone. Get one wrong and you are back to slow charging.',
    sections: [
      {
        heading: 'iPhone: 20W USB-C PD is the sweet spot',
        body: [
          'iPhone 8 and newer fast-charge with any USB-C Power Delivery adapter of 20W or more, reaching about 50% in 30 minutes. Higher wattage does not make an iPhone charge noticeably faster.',
        ],
        products: ['p-20w-charger', 'p-lightning-cable'],
      },
      {
        heading: 'Samsung and laptops: go GaN',
        body: [
          'Gallium-nitride (GaN) chargers are smaller and run cooler. A 65W GaN charger can power a laptop and a phone together — ideal as one travel charger.',
        ],
        products: ['p-65w-gan', 'p-usbc-cable'],
      },
      {
        heading: 'Stay safe',
        body: [
          'Avoid unbranded chargers with no over-voltage protection: during voltage fluctuations they can damage batteries. Choose chargers with PD certification and a cable rated for the wattage.',
        ],
      },
    ],
  },
  {
    slug: 'power-bank-buying-guide-pakistan',
    title: 'Power Bank Buying Guide: 10000 vs 20000 mAh in Pakistan',
    description:
      'Which power bank should you buy in Pakistan for load-shedding and travel? 10000 vs 20000 mAh, PD fast charging and airline rules explained.',
    keyword: 'power bank price in Pakistan',
    date: '2026-10-05',
    author: 'Tahrio Team',
    categoryId: 'power-banks',
    intro:
      'Between load-shedding and long travel days, a power bank is the most useful accessory you can own. Here is how to pick the right capacity.',
    sections: [
      {
        heading: '10000 mAh: pocket-friendly daily carry',
        body: ['About two full phone charges in a slim body — perfect for university and office days.'],
        products: ['p-power-bank-10k'],
      },
      {
        heading: '20000 mAh: travel and load-shedding',
        body: ['Charges three devices at once and keeps a phone going for four to five days of light use.'],
        products: ['p-power-bank-20k'],
      },
      {
        heading: 'Flying with a power bank',
        body: [
          'Airlines including PIA allow power banks up to 100 Wh (about 27,000 mAh) in cabin baggage only — never in checked luggage.',
        ],
      },
    ],
  },
];

export const findPost = (slug: string) => posts.find((p) => p.slug === slug);
