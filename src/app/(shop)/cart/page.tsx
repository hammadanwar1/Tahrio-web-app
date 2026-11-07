import type { Metadata } from 'next';

import { CartView } from '@/components/cart-view';
import { getCatalog } from '@/lib/catalog';
import { toLiveProducts } from '@/lib/live-products';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Your cart',
  description: 'Review the items in your Tahrio cart.',
  path: '/cart',
  noindex: true,
});

export default async function CartPage() {
  const { products } = await getCatalog();
  return (
    <div className="container-page max-w-5xl pt-6">
      <h1 className="mb-6 text-[28px] font-bold">My Cart</h1>
      <CartView live={toLiveProducts(products)} />
    </div>
  );
}
