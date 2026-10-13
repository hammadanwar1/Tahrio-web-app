// Hand-written, unique landing copy per collection. Titles/descriptions target the
// "<product> price in Pakistan" / "buy <product> online in Pakistan" search patterns.
// Keyed by category id from the API.

export interface CollectionSeo {
  title: string; // <title> (≤ 60 chars before the " | Tahrio" suffix)
  description: string; // meta description (≤ 158 chars)
  h1: string;
  intro: string; // shown above the grid
  faqs: { q: string; a: string }[];
}

export const collectionSeo: Record<string, CollectionSeo> = {
  cases: {
    title: 'Phone Cases & Covers in Pakistan – iPhone & Samsung',
    description:
      'Buy original phone cases and covers in Pakistan: MagSafe clear cases, silicone and shockproof covers for iPhone and Samsung. Cash on delivery, 7-day returns.',
    h1: 'Phone Cases & Covers',
    intro:
      'Protect your phone without hiding its design. Our MagSafe-compatible clear cases resist yellowing, silicone covers add grip with a soft microfiber lining, and every case has raised edges to guard the screen and camera.',
    faqs: [
      { q: 'Do your clear cases turn yellow?', a: 'Our Magnetic Clear Case uses an anti-yellowing coating, so it stays clear far longer than ordinary TPU cases.' },
      { q: 'Are the cases MagSafe compatible?', a: 'Cases marked MagSafe have a built-in magnet ring that works with MagSafe chargers, wallets and car mounts.' },
      { q: 'Which phone models do you stock cases for?', a: 'We stock cases for current iPhone and Samsung Galaxy models. Choose your model on the product page before adding to cart.' },
    ],
  },
  earbuds: {
    title: 'Wireless Earbuds Price in Pakistan – ANC & Gaming',
    description:
      'Shop wireless earbuds in Pakistan: ANC earbuds, gaming buds with low latency, neckbands and wired earphones. Free delivery, cash on delivery nationwide.',
    h1: 'Wireless Earbuds & Earphones',
    intro:
      'From active noise cancelling earbuds for the commute to low-latency gaming buds and long-battery neckbands, find the right sound for your budget. Every pair is tested for battery life and call quality before dispatch.',
    faqs: [
      { q: 'What is the best ANC earbuds price in Pakistan?', a: 'Tahrio Pods Pro ANC deliver active noise cancellation and 30 hours of playtime with the case at a sale price well under Rs 7,000.' },
      { q: 'Are these earbuds good for PUBG and gaming?', a: 'Tahrio Gaming Buds have a 45 ms low-latency mode so audio stays in sync with gameplay.' },
      { q: 'Do the earbuds work with both Android and iPhone?', a: 'Yes. All our Bluetooth earbuds pair with any Android phone, iPhone, tablet or laptop.' },
    ],
  },
  chargers: {
    title: 'Fast Charger Price in Pakistan – 20W, 65W GaN, Wireless',
    description:
      'Buy fast chargers in Pakistan: 20W USB-C PD chargers for iPhone, 65W GaN laptop chargers and Qi wireless pads. Original quality, cash on delivery.',
    h1: 'Fast Chargers',
    intro:
      'Charge faster and safer with USB-C Power Delivery chargers. The 20W charger takes an iPhone to 50% in about 30 minutes, while our 65W GaN charger powers a laptop and phone together from one compact plug.',
    faqs: [
      { q: 'Which charger is best for iPhone fast charging?', a: 'Any USB-C PD charger of 20W or more fast-charges an iPhone 8 or newer. Our 20W Fast Charger is built exactly for this.' },
      { q: 'Can a 65W charger damage my phone?', a: 'No. PD chargers negotiate the right power with each device, so your phone only draws what it supports.' },
    ],
  },
  cables: {
    title: 'USB-C & Lightning Cables in Pakistan – Braided, Fast Charging',
    description:
      'Durable USB-C and Lightning cables in Pakistan: 60W braided fast-charging cables tested for 10,000+ bends. Order online with cash on delivery.',
    h1: 'Charging Cables',
    intro:
      'A good charger is only as fast as its cable. Our nylon-braided USB-C cables carry up to 60W and survive more than 10,000 bends, and our USB-C to Lightning cables support iPhone fast charging.',
    faqs: [
      { q: 'Does the cable support fast charging?', a: 'Yes. USB-C to USB-C cables support up to 60W PD, and USB-C to Lightning cables support iPhone fast charging with a 20W adapter.' },
    ],
  },
  'power-banks': {
    title: 'Power Bank Price in Pakistan – 10000 & 20000 mAh',
    description:
      'Buy power banks in Pakistan: slim 10000mAh and 20000mAh PD power banks with 20W+ fast charging. Free delivery and cash on delivery across Pakistan.',
    h1: 'Power Banks',
    intro:
      'Stay charged through load-shedding and long travel days. Choose a slim 10000mAh power bank for your pocket or a 20000mAh PD power bank that charges three devices at once.',
    faqs: [
      { q: 'How many times can a 10000mAh power bank charge my phone?', a: 'Roughly 2 full charges for most phones with a 4,000–5,000 mAh battery.' },
      { q: 'Can I take a power bank on a flight?', a: 'Yes. Power banks up to 100Wh (about 27,000 mAh) are allowed in cabin baggage on PIA and most airlines.' },
    ],
  },
  watches: {
    title: 'Smart Watch Price in Pakistan – AMOLED & Fitness',
    description:
      'Shop smart watches in Pakistan: AMOLED displays, Bluetooth calling, SpO2 and 100+ sport modes. Original Tahrio watches with cash on delivery.',
    h1: 'Smart Watches',
    intro:
      'Track workouts, sleep and heart rate, and take calls from your wrist. Our smart watches pair with Android and iPhone and last up to 10 days on a charge.',
    faqs: [
      { q: 'Do these smart watches support calling?', a: 'The Tahrio Fit Watch S2 supports Bluetooth calling through its built-in mic and speaker.' },
      { q: 'Are the watches compatible with iPhone?', a: 'Yes, they work with both Android and iOS via the companion app.' },
    ],
  },
  'screen-guards': {
    title: 'Tempered Glass Screen Protectors in Pakistan – 9H',
    description:
      'Buy 9H tempered glass screen protectors in Pakistan with edge-to-edge coverage and an easy install frame. Cash on delivery nationwide.',
    h1: 'Screen Guards & Tempered Glass',
    intro:
      'Edge-to-edge 9H tempered glass that keeps touch sensitivity and clarity, with an installation frame for a bubble-free fit on the first try.',
    faqs: [{ q: 'Does tempered glass affect touch sensitivity?', a: 'No. Our 0.33 mm glass keeps full touch sensitivity and works with in-display fingerprint sensors.' }],
  },
  stands: {
    title: 'Phone Stands & Holders in Pakistan – Desk & Tablet',
    description:
      'Adjustable aluminium phone and tablet stands in Pakistan for work, video calls and streaming. Foldable, sturdy and delivered with cash on delivery.',
    h1: 'Phone Stands & Holders',
    intro: 'Foldable aluminium stands that hold your phone or tablet at the perfect angle for video calls, recipes and streaming.',
    faqs: [],
  },
  speakers: {
    title: 'Bluetooth Speaker Price in Pakistan – Waterproof',
    description:
      'Buy portable Bluetooth speakers in Pakistan: IPX7 waterproof, 12-hour battery and punchy bass. Order online with free delivery and COD.',
    h1: 'Bluetooth Speakers',
    intro: 'Pocket-size speakers with big sound, IPX7 waterproofing for the beach or poolside, and up to 12 hours of playtime.',
    faqs: [],
  },
  car: {
    title: 'Car Phone Holders & Accessories in Pakistan',
    description:
      'Magnetic car phone mounts and car accessories in Pakistan with strong N52 magnets and 360° rotation. Cash on delivery across Pakistan.',
    h1: 'Car Accessories',
    intro: 'Keep navigation in view and your hands on the wheel with strong magnetic mounts that fit any phone.',
    faqs: [],
  },
};

/** Store-wide FAQs (home + /faq page; FAQPage structured data). */
export const storeFaqs = [
  { q: 'Do you offer cash on delivery in Pakistan?', a: 'Yes. Cash on Delivery is available in every city in Pakistan. You can also pay with JazzCash, Easypaisa or a debit/credit card.' },
  { q: 'How long does delivery take?', a: 'Standard delivery is free and takes 2–3 business days in major cities. Express next-day delivery is available for Rs 250.' },
  { q: 'Are your products original?', a: 'Every Tahrio product is quality-checked before dispatch and covered by our 7-day easy return policy.' },
  { q: 'What is your return policy?', a: 'If something is wrong with your order, you can return or exchange it within 7 days of delivery. Returns are free.' },
  { q: 'How can I track my order?', a: 'Use the Track Order page with your order ID (for example TR-20481) or open My Orders in the Tahrio app.' },
  { q: 'Do you have discount codes?', a: 'Yes — use code TAHRIO500 to get Rs 500 off your order at checkout.' },
];
