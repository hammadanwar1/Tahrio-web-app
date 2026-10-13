import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { ProductGrid } from '@/components/product-card';
import { FaqList } from '@/components/sections';
import { collectionSeo } from '@/data/seo-content';
import { getCatalog } from '@/lib/catalog';
import { categoryPath, categorySlug, filterProducts, findCategoryBySlug } from '@/lib/catalog-core';
import { rs } from '@/lib/format';
import { faqLd, itemListLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import type { SortKey } from '@/lib/types';

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.map((c) => ({ slug: categorySlug(c) }));
}

export async function generateMetadata({ params }: PageProps<'/collections/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = findCategoryBySlug(catalog, slug);
  if (!category) notFound();
  const seo = collectionSeo[category.id];
  const prices = filterProducts(catalog, { categoryId: category.id }).map((p) => p.price);
  const from = prices.length ? ` From ${rs(Math.min(...prices))}.` : '';
  return pageMetadata({
    title: seo?.title ?? `${category.name} Price in Pakistan`,
    description: seo?.description ?? `Shop ${category.name.toLowerCase()} online in Pakistan.${from} Cash on delivery.`,
    path: categoryPath(category),
  });
}

const sorts: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: low to high' },
  { key: 'price_desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
];

export default async function CollectionPage({ params }: PageProps<'/collections/[slug]'>) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = findCategoryBySlug(catalog, slug);
  if (!category) notFound();

  const seo = collectionSeo[category.id];
  const products = filterProducts(catalog, { categoryId: category.id });
  const path = categoryPath(category);

  return (
    <>
      <Breadcrumbs items={[{ name: 'All categories', path: '/collections' }, { name: category.name, path }]} />
      <JsonLd data={itemListLd(seo?.h1 ?? category.name, path, products)} />
      {seo?.faqs.length ? <JsonLd data={faqLd(seo.faqs)} /> : null}

      <div className="container-page space-y-6 pt-4">
        <header className="max-w-3xl space-y-2">
          <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">{seo?.h1 ?? category.name}</h1>
          {seo?.intro && <p className="text-[15px] leading-relaxed text-muted">{seo.intro}</p>}
        </header>

        {/* Tag filters + sort link to the search page (noindex) so collection URLs stay canonical. */}
        {!!category.filters?.length && (
          <nav aria-label={`Filter ${category.name}`} className="scrollbar-none flex gap-2 overflow-x-auto">
            <span className="shrink-0 rounded-full bg-ink px-[18px] py-2.5 text-[13px] font-medium text-white">All</span>
            {category.filters.map((t) => (
              <Link
                key={t}
                href={`/search?category=${category.id}&tag=${encodeURIComponent(t)}`}
                rel="nofollow"
                className="shrink-0 rounded-full border border-line bg-surface px-[18px] py-2.5 text-[13px] font-medium hover:border-primary"
              >
                {t}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
          <details className="relative">
            <summary className="cursor-pointer list-none font-medium">Sort: Popular ⌄</summary>
            <ul className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-line bg-surface p-2 shadow-card">
              {sorts.map((s) => (
                <li key={s.key}>
                  <Link
                    rel="nofollow"
                    href={`/search?category=${category.id}&sort=${s.key}`}
                    className="block rounded-xl px-3 py-2 hover:bg-primary-soft"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {products.length ? (
          <ProductGrid products={products} eagerCount={4} />
        ) : (
          <p className="rounded-card border border-line bg-surface p-10 text-center text-muted">
            New {category.name.toLowerCase()} are arriving soon.{' '}
            <Link href="/collections" className="font-medium text-primary">
              Browse other categories
            </Link>
          </p>
        )}

        {seo?.faqs.length ? (
          <section className="max-w-3xl pt-6">
            <h2 className="mb-4 text-2xl font-bold">{category.name} – FAQs</h2>
            <FaqList faqs={seo.faqs} />
          </section>
        ) : null}
      </div>
    </>
  );
}
