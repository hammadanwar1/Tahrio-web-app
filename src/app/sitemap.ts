import type { MetadataRoute } from 'next';

import { posts } from '@/data/blog';
import { getCatalog } from '@/lib/catalog';
import { categoryPath, productImage, productPath } from '@/lib/catalog-core';
import { absoluteUrl } from '@/lib/site';

const staticPages: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/collections', priority: 0.9, changeFrequency: 'daily' },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/track-order', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/shipping-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/return-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy-policy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
];

/** /sitemap.xml — every indexable URL, with product photos for Google Images. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const lastModified = catalog.fetchedAt;
  return [
    ...staticPages.map((s) => ({ url: absoluteUrl(s.path), lastModified, changeFrequency: s.changeFrequency, priority: s.priority })),
    ...catalog.categories.map((c) => ({
      url: absoluteUrl(categoryPath(c)),
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...catalog.products.map((p) => {
      const img = productImage(p);
      return {
        url: absoluteUrl(productPath(p)),
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        images: img ? [img.startsWith('http') ? img : absoluteUrl(img)] : undefined,
      };
    }),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updated ?? post.date,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
