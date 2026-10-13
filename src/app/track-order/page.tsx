import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ContentPage } from '@/components/content-page';
import { TrackOrders } from '@/components/order-views';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Track Your Order',
  description: `Track your ${site.name} order status and estimated delivery date anywhere in Pakistan.`,
  path: '/track-order',
});

export default function TrackOrderPage() {
  return (
    <ContentPage
      title="Track your order"
      path="/track-order"
      intro="See the live status of orders placed from this device. Need help? Message us on WhatsApp with your order ID."
    >
      <Suspense fallback={<p className="text-muted">Loading your orders…</p>}>
        <TrackOrders />
      </Suspense>
    </ContentPage>
  );
}
