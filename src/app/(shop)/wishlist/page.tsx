import type { Metadata } from 'next';

import { WishlistView } from '@/components/wishlist-view';
import { getCatalog } from '@/lib/catalog';
import { withDiscount } from '@/lib/catalog-core';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Wishlist',
  description: 'Products you saved on Tahrio.',
  path: '/wishlist',
  noindex: true,
});

export default async function WishlistPage() {
  const { products } = await getCatalog();
  return (
    <div className="container-page pt-6">
      <h1 className="mb-6 text-[28px] font-bold">Wishlist</h1>
      <WishlistView products={products.map(withDiscount)} />
    </div>
  );
}
