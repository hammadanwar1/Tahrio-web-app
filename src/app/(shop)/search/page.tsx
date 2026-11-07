import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SearchX } from 'lucide-react';

import { ProductGrid } from '@/components/product-card';
import { getCatalog } from '@/lib/catalog';
import { filterProducts } from '@/lib/catalog-core';
import { pageMetadata } from '@/lib/seo';
import type { ProductFilter, SortKey } from '@/lib/types';

// Search result pages are infinite and thin → noindex, but follow links to products.
export const metadata: Metadata = pageMetadata({
  title: 'Search mobile accessories',
  description: 'Search Tahrio for earbuds, phone cases, chargers, cables, power banks and smart watches.',
  path: '/search',
  noindex: true,
});

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const sorts: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Relevance' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
];

export default function SearchPage({ searchParams }: PageProps<'/search'>) {
  return (
    <div className="container-page pt-6">
      <Suspense fallback={<p className="py-20 text-center text-muted">Searching…</p>}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const catalog = await getCatalog();
  const sortParam = one(sp.sort) as SortKey | undefined;
  const filter: ProductFilter = {
    q: one(sp.q),
    categoryId: one(sp.category),
    tag: one(sp.tag),
    minPrice: num(sp.min),
    maxPrice: num(sp.max),
    minRating: num(sp.rating),
    onSale: one(sp.sale) === '1',
    freeDelivery: one(sp.free) === '1',
    inStock: one(sp.stock) === '1',
    sort: sorts.some((s) => s.key === sortParam) ? sortParam : 'popular',
  };
  const results = filterProducts(catalog, filter);
  const category = catalog.categories.find((c) => c.id === filter.categoryId);
  const heading = filter.q ? `Results for “${filter.q}”` : category ? category.name : 'All products';

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <form action="/search" className="h-fit space-y-5 rounded-card border border-line bg-surface p-5 text-sm">
        <h2 className="text-lg font-bold">Filters</h2>
        <label className="block space-y-1.5">
          <span className="font-medium">Search</span>
          <input
            name="q"
            type="search"
            defaultValue={filter.q}
            className="h-11 w-full rounded-input border border-line px-3 focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="font-medium">Category</span>
          <select name="category" defaultValue={filter.categoryId ?? ''} className="h-11 w-full rounded-input border border-line bg-surface px-3">
            <option value="">All categories</option>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 font-medium">Price (Rs)</legend>
          <div className="flex gap-2">
            <input name="min" type="number" min={0} step={100} placeholder="Min" defaultValue={filter.minPrice} aria-label="Minimum price" className="h-11 w-full rounded-input border border-line px-3" />
            <input name="max" type="number" min={0} step={100} placeholder="Max" defaultValue={filter.maxPrice} aria-label="Maximum price" className="h-11 w-full rounded-input border border-line px-3" />
          </div>
        </fieldset>
        <label className="block space-y-1.5">
          <span className="font-medium">Rating</span>
          <select name="rating" defaultValue={filter.minRating ?? ''} className="h-11 w-full rounded-input border border-line bg-surface px-3">
            <option value="">Any</option>
            <option value="4">4★ & up</option>
            <option value="3">3★ & up</option>
          </select>
        </label>
        <fieldset className="space-y-2">
          <legend className="mb-1.5 font-medium">Offers</legend>
          {[
            ['sale', 'On sale only', filter.onSale],
            ['free', 'Free delivery', filter.freeDelivery],
            ['stock', 'In stock', filter.inStock],
          ].map(([name, label, on]) => (
            <label key={name as string} className="flex items-center gap-2">
              <input type="checkbox" name={name as string} value="1" defaultChecked={on as boolean} className="size-4 accent-primary" />
              {label as string}
            </label>
          ))}
        </fieldset>
        <label className="block space-y-1.5">
          <span className="font-medium">Sort by</span>
          <select name="sort" defaultValue={filter.sort} className="h-11 w-full rounded-input border border-line bg-surface px-3">
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {filter.tag && <input type="hidden" name="tag" value={filter.tag} />}
        <div className="flex gap-2">
          <button type="submit" className="bg-gradient-button h-11 flex-1 rounded-button font-semibold text-white">
            Show results
          </button>
          <Link href="/search" className="flex h-11 items-center rounded-button border border-line px-4 font-medium">
            Reset
          </Link>
        </div>
      </form>

      <section aria-live="polite">
        <h1 className="text-[26px] font-bold">{heading}</h1>
        <p className="mb-5 text-sm text-muted">
          {results.length} {results.length === 1 ? 'result' : 'results'}
          {filter.tag ? ` · ${filter.tag}` : ''}
        </p>
        {results.length ? (
          <ProductGrid products={results} eagerCount={4} />
        ) : (
          <div className="flex flex-col items-center rounded-card border border-line bg-surface px-6 py-14 text-center">
            <span className="mb-5 flex size-24 items-center justify-center rounded-full bg-primary-soft text-primary">
              <SearchX aria-hidden className="size-10" />
            </span>
            <h2 className="text-[22px] font-bold">No results found</h2>
            <p className="mt-2 max-w-sm text-muted">
              We couldn&apos;t find anything{filter.q ? ` for “${filter.q}”` : ''}. Check the spelling or try a broader keyword.
            </p>
            <p className="mt-6 text-sm text-muted">Try searching for</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {catalog.trending.map((t) => (
                <li key={t}>
                  <Link href={`/search?q=${encodeURIComponent(t)}`} className="block rounded-full border border-line px-4 py-2 text-sm hover:border-primary">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/collections" className="bg-gradient-button mt-8 rounded-button px-10 py-4 font-semibold text-white">
              Browse Categories
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
