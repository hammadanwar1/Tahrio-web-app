import type { Metadata } from 'next';

import { clampText } from './format';
import { site } from './site';

/** Google shows ~600px of a title — keep the full <title> within ~65 characters. */
export const MAX_TITLE = 65;
const SUFFIX = ` | ${site.name}`;

interface PageSeo {
  /** Page title; " | Tahrio" is appended when it fits within MAX_TITLE. */
  title: string;
  description: string;
  /** Path for the canonical URL and og:url, e.g. "/collections/earbuds". */
  path: string;
  /**
   * Share image. Default: the site-wide /opengraph-image. Pass `false` for routes that have their
   * own opengraph-image file (e.g. products), so the file convention supplies it.
   */
  image?: { url: string; width?: number; height?: number; alt?: string } | false;
  type?: 'website' | 'article';
  /** Utility pages (search, cart, checkout): keep out of the index but let links be followed. */
  noindex?: boolean;
}

const defaultImage = { url: '/opengraph-image', width: 1200, height: 630, alt: `${site.name} – mobile accessories in Pakistan` };

/**
 * Full metadata for a page. Nested metadata objects are shallow-merged in Next.js (a child
 * `openGraph` replaces the parent's wholesale, including images), so every page sets the complete set here.
 */
export function pageMetadata({ title, description, path, image, type = 'website', noindex }: PageSeo): Metadata {
  const desc = clampText(description);
  const img = image === false ? undefined : (image ?? defaultImage);
  return {
    title: title.length + SUFFIX.length > MAX_TITLE ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: site.name,
      locale: site.locale,
      url: path,
      title,
      description: desc,
      ...(img ? { images: [img] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      ...(img ? { images: [img.url] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** "<product> Price in Pakistan[ – 28% off]", shortened to fit MAX_TITLE. */
export function productTitle(p: { name: string; fullName: string; discount?: number }) {
  const base = `${p.fullName} Price in Pakistan`.length <= MAX_TITLE - 10 ? p.fullName : p.name;
  const t = `${base} Price in Pakistan`;
  const sale = p.discount ? ` – ${p.discount}% off` : '';
  return (t + sale).length <= MAX_TITLE ? t + sale : t;
}
