import type { MetadataRoute } from 'next';

import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} – Mobile Accessories`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f5fc',
    theme_color: '#4363ff',
    lang: site.language,
    categories: ['shopping'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
