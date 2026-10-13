import type { Metadata } from 'next';
import { Suspense } from 'react';

import { OrderSuccess } from '@/components/order-views';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Order placed',
  description: 'Thank you for shopping with Tahrio.',
  path: '/order/success',
  noindex: true,
});

export default function OrderSuccessPage() {
  return (
    <div className="container-page max-w-xl pt-10">
      <Suspense>
        <OrderSuccess />
      </Suspense>
    </div>
  );
}
