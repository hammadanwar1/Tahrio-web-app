import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentPage } from '@/components/content-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Service',
  description: `Terms and conditions for shopping at ${site.name}: orders, pricing, payment, delivery and returns.`,
  path: '/terms',
});

export default function Terms() {
  return (
    <ContentPage title="Terms of service" path="/terms">
      <h2>Orders & pricing</h2>
      <p>All prices are in Pakistani Rupees (PKR) and include taxes. We confirm every order by phone or SMS before dispatch.</p>
      <h2>Payment</h2>
      <p>We accept cash on delivery, JazzCash, Easypaisa and debit/credit cards.</p>
      <h2>Delivery & returns</h2>
      <p>
        See our <Link href="/shipping-policy">shipping policy</Link> and <Link href="/return-policy">return policy</Link>.
      </p>
      <h2>Contact</h2>
      <p>
        Questions? <Link href="/contact">Contact us</Link>.
      </p>
    </ContentPage>
  );
}
