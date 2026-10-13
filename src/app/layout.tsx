import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';

import { JsonLd } from '@/components/json-ld';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StoreProvider } from '@/components/store-provider';
import { organizationLd, websiteLd } from '@/lib/jsonld';
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
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <StoreProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  );
}
