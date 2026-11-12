// schema.org structured data builders (Google rich results: Product, Review snippets,
// Merchant listings, Breadcrumbs, Sitelinks search box, Organization, FAQ).
import { categoryPath, productImage, productPath } from './catalog-core';
import { absoluteUrl, site } from './site';
import type { Category, Product, Review } from './types';

type Thing = Record<string, unknown>;

const orgId = `${site.url}/#organization`;
const websiteId = `${site.url}/#website`;

export function organizationLd(): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': orgId,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: absoluteUrl('/brand/logo.png'),
    image: absoluteUrl('/opengraph-image'),
    description: site.description,
    slogan: site.tagline,
    email: site.email,
    telephone: site.phone,
    address: { '@type': 'PostalAddress', ...site.address },
    areaServed: { '@type': 'Country', name: 'Pakistan' },
    currenciesAccepted: site.currency,
    paymentAccepted: 'Cash on Delivery, JazzCash, Easypaisa, Debit Card, Credit Card',
    sameAs: Object.values(site.social),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: site.phone,
      email: site.email,
      areaServed: 'PK',
      availableLanguage: ['English', 'Urdu'],
    },
    hasMerchantReturnPolicy: returnPolicyLd(),
  };
}

export function websiteLd(): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: site.url,
    name: site.name,
    inLanguage: site.language,
    publisher: { '@id': orgId },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

function returnPolicyLd(): Thing {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: site.country,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: site.policy.returnDays,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };
}

function shippingLd(): Thing {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: site.policy.standardDeliveryFee, currency: site.currency },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: site.country },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: site.policy.deliveryDays.min,
        maxValue: site.policy.deliveryDays.max,
        unitCode: 'DAY',
      },
    },
  };
}

/** Price validity dates come from the cached catalog snapshot (no Date() during prerender). */
export function productLd(
  p: Product,
  category: Category | undefined,
  reviews: Review[],
  priceValidUntil: string,
  priceValidFrom: string,
): Thing {
  const url = absoluteUrl(productPath(p));
  const image = productImage(p);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.fullName,
    description: p.description,
    sku: p.id,
    mpn: p.id,
    url,
    image: image ? [absoluteUrl(image)] : undefined,
    brand: { '@type': 'Brand', name: site.name },
    category: category?.name,
    color: p.colors.map((c) => c.name).join(', ') || undefined,
    aggregateRating:
      p.reviews > 0
        ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews, bestRating: 5, worstRating: 1 }
        : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.userName },
      datePublished: r.createdAt.slice(0, 10),
      reviewBody: r.text,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: site.currency,
      price: p.price,
      validFrom: priceValidFrom,
      priceValidUntil,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': orgId },
      shippingDetails: shippingLd(),
      hasMerchantReturnPolicy: returnPolicyLd(),
      ...(p.oldPrice && p.oldPrice > p.price
        ? {
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              priceType: 'https://schema.org/StrikethroughPrice',
              price: p.oldPrice,
              priceCurrency: site.currency,
            },
          }
        : {}),
    },
  };
}

/** Collection page: ItemList of product URLs (eligible for carousel-style results). */
export function itemListLd(name: string, path: string, products: Product[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: absoluteUrl(path),
    isPartOf: { '@id': websiteId },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(productPath(p)),
        name: p.fullName,
      })),
    },
  };
}

export function faqLd(faqs: { q: string; a: string }[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export const categoryUrl = (c: Category) => absoluteUrl(categoryPath(c));

/**
 * Serialise for a <script type="application/ld+json">. Escapes "<" so product text can never
 * close the script tag (XSS-safe, as recommended by the Next.js JSON-LD guide).
 */
export const serializeLd = (data: Thing | Thing[]) => JSON.stringify(data).replace(/</g, '\\u003c');
