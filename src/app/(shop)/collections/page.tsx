import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductGlyph } from '@/components/product-glyph';
import { PromoBanner } from '@/components/sections';
import { getCatalog } from '@/lib/catalog';
import { categoryPath } from '@/lib/catalog-core';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'All Mobile Accessories Categories in Pakistan',
  description:
    'Browse every Tahrio category: phone cases, wireless earbuds, fast chargers, cables, power banks, smart watches, screen guards and car accessories — all with cash on delivery.',
  path: '/collections',
});

export default async function CollectionsPage() {
  const { categories, banners } = await getCatalog();
  const banner = banners.find((b) => b.placement === 'categories');
  const bannerCategory = categories.find((c) => c.id === banner?.categoryId);
  return (
    <>
      <Breadcrumbs items={[{ name: 'All categories', path: '/collections' }]} />
      <div className="container-page space-y-8 pt-4">
        <header>
          <h1 className="text-[28px] font-bold">All Categories</h1>
          <p className="text-muted">{categories.length} categories of original mobile accessories</p>
        </header>
        {banner && <PromoBanner banner={banner} category={bannerCategory} />}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={categoryPath(c)}
                className="group relative flex h-full flex-col gap-3 rounded-card border border-line bg-surface p-4 transition-shadow hover:shadow-card"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <ProductGlyph kind={c.icon} className="size-6" />
                </span>
                {c.badge && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
                      c.badge === 'NEW' ? 'bg-primary' : 'bg-ink'
                    }`}
                  >
                    {c.badge}
                  </span>
                )}
                <span className="mt-auto">
                  <span className="block font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted">
                    {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <ArrowRight aria-hidden className="absolute bottom-4 right-4 size-4 text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
