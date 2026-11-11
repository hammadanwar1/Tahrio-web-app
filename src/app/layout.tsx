import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';

import { site } from '@/lib/site';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `Mobile Accessories in Pakistan: Earbuds, Cases & More | ${site.name}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: 'shopping',
  formatDetection: { telephone: false, address: false, email: false },
  // "Add to Home Screen" on iPhone: app name and status bar.
  appleWebApp: { title: site.name, capable: true, statusBarStyle: 'default' },
  // Store location for local search (Bing reads these; Google uses the JSON-LD address).
  other: {
    'geo.region': `${site.country}-IS`,
    'geo.placename': site.address.addressLocality,
  },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: site.locale,
    title: `${site.name} – Original Mobile Accessories in Pakistan`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} – Original Mobile Accessories in Pakistan`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  // Search Console / Bing verification tokens (set in env when available).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: '#4363ff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-PK" className={`${outfit.variable} h-full`}>
      {/* Storefront chrome lives in (shop)/layout.tsx so /admin can use its own shell. */}
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
