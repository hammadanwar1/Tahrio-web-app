import type { Metadata } from 'next';

import { ContentPage } from '@/components/content-page';
import { JsonLd } from '@/components/json-ld';
import { FaqList } from '@/components/sections';
import { collectionSeo, storeFaqs } from '@/data/seo-content';
import { faqLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'FAQs – Delivery, Cash on Delivery & Returns',
  description: 'Answers about delivery times, cash on delivery, returns, discount codes and our products at Tahrio, Pakistan.',
  path: '/faq',
});

const productFaqs = Object.values(collectionSeo).flatMap((c) => c.faqs);

export default function FaqPage() {
  return (
    <ContentPage title="Frequently asked questions" path="/faq">
      <JsonLd data={faqLd([...storeFaqs, ...productFaqs])} />
      <h2>Orders, delivery & returns</h2>
      <FaqList faqs={storeFaqs} />
      <h2>Products</h2>
      <FaqList faqs={productFaqs} />
    </ContentPage>
  );
}
