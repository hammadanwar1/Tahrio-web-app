import type { Metadata } from 'next';

import { BrandTile } from '@/components/brand-tile';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { getCatalog } from '@/lib/catalog';
import { brandPath, listBrands } from '@/lib/catalog-core';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shop by Brand – Original Mobile Accessories in Pakistan',
  description: 'Browse original mobile accessory brands at Tahrio. Cash on delivery across Pakistan.',
  path: '/brands',
});

export default async function BrandsPage() {
  const brands = listBrands(await getCatalog());
  return (
    <>
      <Breadcrumbs items={[{ name: 'Brands', path: '/brands' }]} />
      <div className="container-page space-y-6 pt-4">
        <h1 className="text-[28px] font-bold">Shop by Brand</h1>
        <ul className="grid grid-cols-2 overflow-hidden rounded-card border-l border-t border-line bg-surface sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((b) => (
            <li key={b.slug} className="border-b border-r border-line">
              <BrandTile brand={{ ...b, href: brandPath(b.name) }} height="h-28" />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
