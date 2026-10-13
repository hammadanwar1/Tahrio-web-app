import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentPage } from '@/components/content-page';
import { rs } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Shipping & Delivery Policy',
  description: `Free standard delivery across Pakistan in ${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} business days, express next-day delivery and cash on delivery.`,
  path: '/shipping-policy',
});

export default function ShippingPolicy() {
  const { deliveryDays, expressDeliveryFee } = site.policy;
  return (
    <ContentPage title="Shipping & delivery" path="/shipping-policy">
      <h2>Delivery options</h2>
      <ul>
        <li>
          Standard: free, {deliveryDays.min}–{deliveryDays.max} business days in major cities.
        </li>
        <li>Express: {rs(expressDeliveryFee)}, next-day delivery where available.</li>
      </ul>
      <h2>Coverage</h2>
      <p>
        We deliver to all cities and towns in Pakistan through our courier partner, Tahrio Express. Remote areas may
        take 1–2 extra days.
      </p>
      <h2>Cash on delivery</h2>
      <p>Pay in cash when your parcel arrives. Please keep the exact amount ready.</p>
      <h2>Tracking</h2>
      <p>
        Once your order ships you can follow it on the <Link href="/track-order">Track Order</Link> page or in the Tahrio
        app.
      </p>
    </ContentPage>
  );
}
