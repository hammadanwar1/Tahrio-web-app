import type { Metadata } from 'next';

import { ContentPage } from '@/components/content-page';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Tahrio – Customer Support',
  description: `Contact ${site.name} customer support by WhatsApp, phone or email for orders, delivery and returns anywhere in Pakistan.`,
  path: '/contact',
});

export default function ContactPage() {
  return (
    <ContentPage title="Contact us" path="/contact" intro="We usually reply within a few hours, Monday to Saturday, 10am–7pm.">
      <ul>
        <li>
          WhatsApp:{' '}
          <a href={`https://wa.me/${site.whatsapp}`} rel="noopener" target="_blank">
            {site.phone}
          </a>
        </li>
        <li>
          Phone: <a href={`tel:${site.phone.replace(/-/g, '')}`}>{site.phone}</a>
        </li>
        <li>
          Email: <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        <li>
          Address: {site.address.addressLocality}, Pakistan
        </li>
      </ul>
      <p>Please include your order ID (for example TR-20481) so we can help faster.</p>
    </ContentPage>
  );
}
