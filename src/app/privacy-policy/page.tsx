import type { Metadata } from 'next';

import { ContentPage } from '@/components/content-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: `How ${site.name} collects, uses and protects your personal information when you shop with us.`,
  path: '/privacy-policy',
});

export default function PrivacyPolicy() {
  return (
    <ContentPage title="Privacy policy" path="/privacy-policy">
      <p>We collect only what we need to deliver your order: your name, phone number, delivery address and order details.</p>
      <h2>How we use your data</h2>
      <ul>
        <li>To process, deliver and support your orders.</li>
        <li>To send order updates by SMS or WhatsApp.</li>
        <li>To improve our store with anonymous analytics.</li>
      </ul>
      <h2>Sharing</h2>
      <p>We share delivery details only with our courier and payment partners. We never sell your data.</p>
      <h2>Your rights</h2>
      <p>
        Email <a href={`mailto:${site.email}`}>{site.email}</a> to access or delete your data.
      </p>
    </ContentPage>
  );
}
