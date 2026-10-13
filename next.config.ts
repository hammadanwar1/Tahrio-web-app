import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Off so product/collection params are awaited before streaming: unknown slugs return a real
  // HTTP 404 (with it on, notFound() inside Suspense returns 200 + noindex) — better for SEO.
  partialPrefetching: false,
  poweredByHeader: false,
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
    // Product photos served by the Tahrio API/CDN (add the production host here).
    remotePatterns: process.env.TAHRIO_IMAGE_HOST ? [{ protocol: 'https', hostname: process.env.TAHRIO_IMAGE_HOST }] : [],
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
