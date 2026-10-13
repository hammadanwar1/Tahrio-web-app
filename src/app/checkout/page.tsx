import type { Metadata } from 'next';

import { CheckoutForm } from '@/components/checkout-form';
import { getCatalog } from '@/lib/catalog';
import { toLiveProducts } from '@/lib/live-products';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Checkout',
  description: 'Complete your Tahrio order with cash on delivery, JazzCash, Easypaisa or card.',
  path: '/checkout',
  noindex: true,
});

export default async function CheckoutPage() {
  const { products } = await getCatalog();
  return (
    <div className="container-page max-w-5xl pt-6">
      <h1 className="mb-6 text-[28px] font-bold">Checkout</h1>
      <CheckoutForm live={toLiveProducts(products)} />
    </div>
  );
}
