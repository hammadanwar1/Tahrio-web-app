import type { Metadata } from 'next';
import Link from 'next/link';

import { StoreChrome } from '@/components/store-chrome';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

// Rendered under the root layout only (unknown URLs and notFound() anywhere), so it brings its own chrome.
export default function NotFound() {
  return (
    <StoreChrome>
      <div className="container-page flex flex-col items-center py-24 text-center">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-[28px] font-bold">This page doesn&apos;t exist</h1>
        <p className="mt-2 max-w-md text-muted">The product may have been removed or the link is wrong. Try searching or browse our categories.</p>
        <form action="/search" className="mt-8 flex w-full max-w-md gap-2">
          <label htmlFor="nf-search" className="sr-only">
            Search products
          </label>
          <input id="nf-search" name="q" type="search" placeholder="Search products" className="h-12 flex-1 rounded-input border border-line bg-surface px-4" />
          <button type="submit" className="bg-gradient-button rounded-button px-6 font-semibold text-white">
            Search
          </button>
        </form>
        <Link href="/collections" className="mt-6 font-medium text-primary hover:underline">
          Browse all categories
        </Link>
      </div>
    </StoreChrome>
  );
}
