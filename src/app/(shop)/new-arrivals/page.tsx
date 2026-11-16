import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { CategoryStrip } from '@/components/category-strip';
import { JsonLd } from '@/components/json-ld';
import { PageHero } from '@/components/page-hero';
import { ProductListing } from '@/components/product-listing';
import { getCatalog } from '@/lib/catalog';
import { filterProducts } from '@/lib/catalog-core';
import { itemListLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'New Arrivals – Latest Mobile Accessories in Pakistan',
  description:
    'The latest mobile accessories at Tahrio: new earbuds, smart watches, GaN chargers and power banks. Cash on delivery across Pakistan.',
  path: '/new-arrivals',
  keywords: ['new mobile accessories Pakistan', 'latest earbuds Pakistan', 'new arrivals gadgets Pakistan'],
});

export default async function NewArrivalsPage() {
  const catalog = await getCatalog();
  const products = filterProducts(catalog, { section: 'new' });

  return (
    <>
      <Breadcrumbs items={[{ name: 'New Arrivals', path: '/new-arrivals' }]} />
      <JsonLd data={itemListLd('New Arrivals', '/new-arrivals', products)} />
      <div className="container-page space-y-8 pt-4">
        <PageHero
          eyebrow="Just landed"
          title="Checkout exclusive new arrivals"
          text="Fresh stock of the latest earbuds, smart watches, chargers and power banks."
        />
        <CategoryStrip categories={catalog.categories} />
        <ProductListing title="New Arrivals" products={products} />
      </div>
    </>
  );
}
