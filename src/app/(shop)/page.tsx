import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/json-ld';
import { ProductGrid } from '@/components/product-card';
import { CategoryStrip } from '@/components/category-strip';
import { FaqList, PromoBanner, SectionHeader } from '@/components/sections';
import { deviceFamilies } from '@/data/devices';
import { storeFaqs } from '@/data/seo-content';
import { getCatalog } from '@/lib/catalog';
import { filterProducts, modelPath } from '@/lib/catalog-core';
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
  const sale = filterProducts(catalog, { onSale: true }).sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
  const banner = catalog.banners.find((b) => b.placement === 'home');
  const bannerCategory = catalog.categories.find((c) => c.id === banner?.categoryId);

  return (
    <div className="container-page space-y-12 pt-6">
      <JsonLd data={faqLd(storeFaqs)} />
      <header className="space-y-1">
        <h1 className="text-[26px] font-bold leading-tight sm:text-[32px]">Original mobile accessories in Pakistan</h1>
        <p className="text-muted">Earbuds, cases, fast chargers & power banks — cash on delivery nationwide.</p>
      </header>
      {banner && <PromoBanner banner={banner} category={bannerCategory} />}

      <section>
        <SectionHeader title="Shop by Category" href="/collections" linkLabel="See all" />
        <CategoryStrip categories={catalog.categories} />
      </section>

      <section>
        <SectionHeader title="Hot Deals" href="/collections" />
        <ProductGrid products={hot.slice(0, 8)} eagerCount={2} />
      </section>

      {sale.length > 0 && (
        <section>
          <SectionHeader title="On Sale" href="/sale" linkLabel="View all deals" />
          <ProductGrid products={sale.slice(0, 4)} />
        </section>
      )}

      <section>
        <SectionHeader title="Shop by Model" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {deviceFamilies.map((f) => (
            <li key={f.id}>
              <Link
                href={modelPath(f.id)}
                className="flex h-full flex-col justify-between gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:border-primary"
              >
                <span className="font-semibold">{f.name}</span>
                <span className="text-xs text-muted">{f.series[0].models[0]} & more</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeader title="New Arrivals" href="/new-arrivals" />
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
            We deliver across Pakistan — Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan,
            Peshawar and beyond — with cash on delivery and a{' '}
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
