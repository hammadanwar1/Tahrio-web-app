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
  title: 'Sale – Discounts on Mobile Accessories in Pakistan',
  description:
    'Mobile accessories on sale in Pakistan: discounted earbuds, phone cases, chargers and power banks. Limited stock, cash on delivery nationwide.',
  path: '/sale',
  keywords: ['mobile accessories sale Pakistan', 'earbuds sale', 'phone case sale', 'charger discount Pakistan'],
});

export default async function SalePage() {
  const catalog = await getCatalog();
  const products = filterProducts(catalog, { onSale: true }).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
  const best = products[0]?.discount ?? 0;

  return (
    <>
      <Breadcrumbs items={[{ name: 'On Sale', path: '/sale' }]} />
      <JsonLd data={itemListLd('On Sale', '/sale', products)} />
      <div className="container-page space-y-8 pt-4">
        <PageHero
          eyebrow="Clearance Sale"
          title={best ? `Up to ${best}% OFF` : 'Deals of the week'}
          text="Original accessories at the lowest prices. Limited stock: grab yours before it's gone."
        />
        <CategoryStrip categories={catalog.categories} />
        <ProductListing title="On Sale" products={products} />
      </div>
    </>
  );
}
