import type { MetadataRoute } from 'next';

import { absoluteUrl, site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Non-production deployments (previews) must never be indexed.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Personal / transactional pages. Search pages use noindex,follow instead (robots must be able to read it).
        disallow: ['/cart', '/checkout', '/wishlist', '/order/', '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: site.url,
  };
}
