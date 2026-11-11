import type { Metadata } from 'next';
import Link from 'next/link';

import { ContentPage } from '@/components/content-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'About Tahrio – Original Mobile Accessories Store in Pakistan',
  description: `${site.name} is a Pakistani online store for original mobile accessories — earbuds, cases, chargers and power banks — with cash on delivery nationwide.`,
  path: '/about',
});

export default function AboutPage() {
  return (
    <ContentPage title="About Tahrio" path="/about" intro={`${site.tagline}.`}>
      <p>
        Tahrio started with a simple idea: phone accessories in Pakistan should be original, fairly priced and
        delivered to your door — without the guesswork of unbranded market stalls.
      </p>
      <h2>What we sell</h2>
      <p>
        We focus on the essentials you use every day: <Link href="/collections/earbuds">wireless earbuds</Link>,{' '}
        <Link href="/collections/phone-cases">phone cases</Link>, <Link href="/collections/chargers">fast chargers</Link>,{' '}
        <Link href="/collections/cables">cables</Link>, <Link href="/collections/power-banks">power banks</Link> and{' '}
        <Link href="/collections/smart-watches">smart watches</Link>.
      </p>
      <h2>Our promise</h2>
      <ul>
        <li>Every product is quality-checked before dispatch.</li>
        <li>
          Standard delivery across Pakistan in {site.policy.deliveryDays.min}–{site.policy.deliveryDays.max} days.
        </li>
        <li>Cash on delivery, JazzCash, Easypaisa and card payments.</li>
        <li>{site.policy.returnDays}-day free returns and exchanges.</li>
      </ul>
    </ContentPage>
  );
}
