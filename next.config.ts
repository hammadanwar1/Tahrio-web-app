import type { NextConfig } from 'next';

/** Photos uploaded in /admin are served at <origin>/uploads/<file> by the API in server.js. */
function apiUploadsPattern() {
  const origins = [process.env.PUBLIC_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.TAHRIO_API_URL];
  return origins.flatMap((origin) => {
    try {
      const { protocol, hostname, port } = new URL(origin ?? '');
      return [{ protocol: protocol.replace(':', '') as 'http' | 'https', hostname, port, pathname: '/uploads/**' }];
    } catch {
      return [];
    }
  });
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Off so product/collection params are awaited before streaming: unknown slugs return a real
  // HTTP 404 (with it on, notFound() inside Suspense returns 200 + noindex) — better for SEO.
  partialPrefetching: false,
  poweredByHeader: false,
  experimental: {
    // Admin product photos (up to 5 MB) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: '6mb' },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Lets `next dev` show photos uploaded to a local API (localhost:4000). Never on in production (SSRF).
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    // Product photos served by the Tahrio API/CDN (add the production host here).
    remotePatterns: [
      ...(process.env.TAHRIO_IMAGE_HOST ? [{ protocol: 'https' as const, hostname: process.env.TAHRIO_IMAGE_HOST }] : []),
      ...apiUploadsPattern(),
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/products/:file*.jpg',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
      },
    ];
  },
  async redirects() {
    // Common alternate URLs → canonical collection pages (keeps link equity in one place).
    return [
      { source: '/category/:slug', destination: '/collections/:slug', permanent: true },
      { source: '/categories', destination: '/collections', permanent: true },
      { source: '/product/:slug', destination: '/products/:slug', permanent: true },
      { source: '/shop', destination: '/collections', permanent: true },
    ];
  },
};

export default nextConfig;
