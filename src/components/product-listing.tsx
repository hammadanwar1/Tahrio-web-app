'use client';

import { useState } from 'react';

import type { Product } from '@/lib/types';
import { ProductGrid } from './product-card';

const sorts = [
  { key: 'featured', label: 'Featured', fn: () => 0 },
  { key: 'new', label: 'New Arrivals', fn: (a: Product, b: Product) => Number(b.isNew) - Number(a.isNew) },
  { key: 'price_asc', label: 'Price (Low – High)', fn: (a: Product, b: Product) => a.price - b.price },
  { key: 'price_desc', label: 'Price (High – Low)', fn: (a: Product, b: Product) => b.price - a.price },
  { key: 'discount', label: 'Discount % (High – Low)', fn: (a: Product, b: Product) => (b.discount ?? 0) - (a.discount ?? 0) },
  { key: 'rating', label: 'Top Rated', fn: (a: Product, b: Product) => b.rating - a.rating },
] as const;

// Desktop grid density, as in the reference: 5 / 4 / 3 / 2 per row.
const densities = [
  { cols: 5, className: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' },
  { cols: 4, className: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' },
  { cols: 3, className: 'grid-cols-2 sm:grid-cols-3' },
  { cols: 2, className: 'grid-cols-2' },
];

/**
 * Product list with "Showing N products", Sort By and a grid density switch. Sorting happens in the
 * browser, so collection URLs stay canonical (no ?sort= variants for Google to crawl).
 */
export function ProductListing({
  title,
  products,
  eagerCount = 4,
  headingLevel = 'h1',
}: {
  title: string;
  products: Product[];
  eagerCount?: number;
  headingLevel?: 'h1' | 'h2';
}) {
  const [sort, setSort] = useState<(typeof sorts)[number]['key']>('featured');
  const [cols, setCols] = useState(4);
  const H = headingLevel;
  const sorted = [...products].sort(sorts.find((s) => s.key === sort)!.fn);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-2">
          <H className="flex flex-wrap items-baseline gap-x-3 text-2xl font-bold sm:text-[28px]">
            {title}
            <span className="text-sm font-medium text-muted">
              Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            </span>
          </H>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <span className="mr-1 font-semibold text-muted">Sort By:</span>
            {sorts.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={sort === s.key}
                onClick={() => setSort(s.key)}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  sort === s.key ? 'bg-gradient-button font-semibold text-white' : 'hover:bg-primary-soft hover:text-primary'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Products per row" className="hidden gap-2 lg:flex">
          {densities.map((d) => (
            <button
              key={d.cols}
              type="button"
              aria-pressed={cols === d.cols}
              aria-label={`${d.cols} per row`}
              onClick={() => setCols(d.cols)}
              className={`flex h-9 items-center gap-[3px] rounded-lg border-2 px-2 ${cols === d.cols ? 'border-ink' : 'border-line'}`}
            >
              {Array.from({ length: d.cols }, (_, i) => (
                <span key={i} className={`h-5 w-2 rounded-sm ${cols === d.cols ? 'bg-ink' : 'bg-line'}`} />
              ))}
            </button>
          ))}
        </div>
      </div>

      {products.length ? (
        <ProductGrid products={sorted} eagerCount={eagerCount} className={densities.find((d) => d.cols === cols)!.className} />
      ) : (
        <p className="rounded-card border border-line bg-surface p-10 text-center text-muted">
          No products here yet. New stock is arriving soon.
        </p>
      )}
    </section>
  );
}
