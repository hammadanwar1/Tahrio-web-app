import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentPage } from '@/components/content-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: `Return & Exchange Policy – ${site.policy.returnDays}-Day Free Returns`,
  description: `Return or exchange any Tahrio product within ${site.policy.returnDays} days of delivery for free. Here is how returns and refunds work in Pakistan.`,
  path: '/return-policy',
});

export default function ReturnPolicy() {
  return (
    <ContentPage
      title="Returns & exchanges"
      path="/return-policy"
      intro={`${site.policy.returnDays}-day free returns on every order.`}
    >
      <h2>Eligibility</h2>
      <ul>
        <li>Request a return within {site.policy.returnDays} days of delivery.</li>
        <li>Items must be unused, with original packaging and accessories.</li>
        <li>Faulty or wrong items are always accepted.</li>
      </ul>
      <h2>How to return</h2>
      <p>
        Message us on <a href={`https://wa.me/${site.whatsapp}`}>WhatsApp</a> or{' '}
        <Link href="/contact">contact support</Link> with your order ID. We arrange a free pickup and send a
        replacement or refund.
      </p>
      <h2>Refunds</h2>
      <p>Refunds are made within 5 business days by bank transfer, JazzCash or Easypaisa after the item is inspected.</p>
    </ContentPage>
  );
}
