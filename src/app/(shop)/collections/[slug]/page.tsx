import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { CategoryStrip } from '@/components/category-strip';
import { JsonLd } from '@/components/json-ld';
import { ProductListing } from '@/components/product-listing';
import { FaqList } from '@/components/sections';
import { collectionSeo } from '@/data/seo-content';
import { getCatalog } from '@/lib/catalog';
import { categoryPath, categorySlug, filterProducts, findCategoryBySlug } from '@/lib/catalog-core';
import { rs } from '@/lib/format';
import { faqLd, itemListLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

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
    image: false, // collections/[slug]/opengraph-image.tsx
    keywords: [
      `${category.name.toLowerCase()} price in Pakistan`,
      `${category.name.toLowerCase()} in Pakistan`,
      `buy ${category.name.toLowerCase()} online in Pakistan`,
      `best ${category.shortName.toLowerCase()} in Pakistan`,
      `${category.name.toLowerCase()} cash on delivery`,
    ],
  });
}

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
        <CategoryStrip categories={catalog.categories} activeId={category.id} />
        <ProductListing title={seo?.h1 ?? category.name} products={products} />
        {seo?.intro && <p className="max-w-3xl text-[15px] leading-relaxed text-muted">{seo.intro}</p>}

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
