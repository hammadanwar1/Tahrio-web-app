import type { Metadata } from 'next';

import { JsonLd } from '@/components/json-ld';
import { ProductGrid } from '@/components/product-card';
import { CategoryTiles, FaqList, PromoBanner, SectionHeader, TrustBar } from '@/components/sections';
import { storeFaqs } from '@/data/seo-content';
import { getCatalog } from '@/lib/catalog';
import { filterProducts } from '@/lib/catalog-core';
import { faqLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Tahrio – Original Mobile Accessories in Pakistan',
    description: site.description,
    path: '/',
  }),
  // Home uses the full brand title without the " | Tahrio" template suffix.
  title: { absolute: `Mobile Accessories in Pakistan: Earbuds, Cases & More | ${site.name}` },
};

export default async function HomePage() {
  const catalog = await getCatalog();
  const hot = filterProducts(catalog, { section: 'hot' });
  const fresh = filterProducts(catalog, { section: 'new' });
  const banner = catalog.banners.find((b) => b.placement === 'home');
  const bannerCategory = catalog.categories.find((c) => c.id === banner?.categoryId);

  return (
    <div className="container-page space-y-12 pt-6">
      <JsonLd data={faqLd(storeFaqs)} />
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold leading-tight sm:text-[32px]">Original mobile accessories in Pakistan</h1>
        <p className="text-muted">Earbuds, cases, fast chargers & power banks — free delivery and cash on delivery nationwide.</p>
      </header>
      {banner && <PromoBanner banner={banner} category={bannerCategory} />}

      <section>
        <SectionHeader title="Categories" href="/collections" linkLabel="See all" />
        <CategoryTiles categories={catalog.categories} />
      </section>

      <section>
        <SectionHeader title="Hot Deals" href="/collections" />
        <ProductGrid products={hot.slice(0, 8)} eagerCount={2} />
      </section>

      <TrustBar />

      <section>
        <SectionHeader title="New Arrivals" href="/collections" />
        <ProductGrid products={fresh.slice(0, 8)} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4 text-[15px] leading-relaxed text-muted">
          <h2 className="text-2xl font-bold text-ink">Buy original mobile accessories online in Pakistan</h2>
          <p>
            Tahrio is an online store for everyday phone essentials: wireless earbuds and ANC earbuds, MagSafe
            phone cases, 20W and 65W fast chargers, braided USB-C cables, slim power banks and smart watches.
          </p>
          <p>
            Every order ships free across Pakistan — Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan,
            Peshawar and beyond — with cash on delivery, JazzCash, Easypaisa or card payment, and a{' '}
            {site.policy.returnDays}-day easy return policy.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-bold">Frequently asked questions</h2>
          <FaqList faqs={storeFaqs} />
        </div>
      </section>
    </div>
  );
}
