import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { PageHero } from '@/components/page-hero';
import { ProductListing } from '@/components/product-listing';
import { SocialIcon, whatsappUrl } from '@/components/social-icons';
import { getCatalog } from '@/lib/catalog';
import { brandPath, listBrands, productsForBrand } from '@/lib/catalog-core';
import { itemListLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export async function generateStaticParams() {
  return listBrands(await getCatalog()).map((b) => ({ slug: b.slug }));
}

async function load(slug: string) {
  const catalog = await getCatalog();
  const brand = listBrands(catalog).find((b) => b.slug === slug);
  if (!brand) notFound();
  return { brand, products: productsForBrand(catalog, slug) };
}

export async function generateMetadata({ params }: PageProps<'/brands/[slug]'>): Promise<Metadata> {
  const { brand, products } = await load((await params).slug);
  return pageMetadata({
    title: `${brand.name} Accessories Price in Pakistan`,
    description: `Shop original ${brand.name} mobile accessories online in Pakistan with cash on delivery nationwide.`,
    path: brandPath(brand.name),
    keywords: [`${brand.name} price in Pakistan`, `${brand.name} accessories Pakistan`, `original ${brand.name} Pakistan`],
    // A brand page with no products yet would be a thin page.
    noindex: products.length === 0,
  });
}

export default async function BrandPage({ params }: PageProps<'/brands/[slug]'>) {
  const { brand, products } = await load((await params).slug);
  const path = brandPath(brand.name);
  return (
    <>
      <Breadcrumbs items={[{ name: 'Brands', path: '/brands' }, { name: brand.name, path }]} />
      {products.length > 0 && <JsonLd data={itemListLd(`${brand.name} accessories`, path, products)} />}
      <div className="container-page space-y-8 pt-4">
        <PageHero eyebrow="Shop by Brand" title={brand.name} text={`Original ${brand.name} accessories, delivered across Pakistan.`} />
        {products.length ? (
          <ProductListing title={`${brand.name} Accessories`} products={products} />
        ) : (
          <section className="rounded-sheet border border-line bg-surface p-8 text-center sm:p-12">
            <h1 className="text-2xl font-bold">{brand.name} products are coming soon</h1>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Looking for something from {brand.name}? Message us on WhatsApp and we&apos;ll check availability for you.
            </p>
            <a
              href={whatsappUrl(`Hi ${site.name}, do you have ${brand.name} products?`)}
              className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white"
            >
              <SocialIcon name="whatsapp" /> Ask on WhatsApp
            </a>
          </section>
        )}
      </div>
    </>
  );
}
