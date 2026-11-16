import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { PageHero } from '@/components/page-hero';
import { ProductGrid } from '@/components/product-card';
import { ProductListing } from '@/components/product-listing';
import { SectionHeader } from '@/components/sections';
import { deviceFamilies } from '@/data/devices';
import { getCatalog } from '@/lib/catalog';
import { filterProducts, modelPath, modelSlug, productsForModels } from '@/lib/catalog-core';
import { itemListLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';

// Cases and screen guards only fit specific models; everything else here works with any phone.
const modelSpecific = new Set(['cases', 'screen-guards']);

/** A /models/<slug> is either a device family ("apple-iphone") or one model ("iphone-17-pro-max"). */
function resolve(slug: string) {
  const family = deviceFamilies.find((f) => f.id === slug);
  if (family) return { name: family.name, models: family.series.flatMap((s) => s.models), family };
  for (const f of deviceFamilies) {
    const model = f.series.flatMap((s) => s.models).find((m) => modelSlug(m) === slug);
    if (model) return { name: model, models: [model], family: f };
  }
  return null;
}

export function generateStaticParams() {
  return deviceFamilies.flatMap((f) => [f.id, ...f.series.flatMap((s) => s.models.map(modelSlug))]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/models/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const target = resolve(slug);
  if (!target) notFound();
  const products = productsForModels(await getCatalog(), target.models);
  return pageMetadata({
    title: `${target.name} Cases, Glass & Accessories in Pakistan`,
    description: `Shop ${target.name} accessories in Pakistan: cases, screen protectors, chargers and more. Cash on delivery nationwide.`,
    path: modelPath(slug),
    keywords: [`${target.name} case price in Pakistan`, `${target.name} accessories Pakistan`, `${target.name} screen protector`],
    // Models with nothing made for them yet would be thin pages.
    noindex: products.length === 0,
  });
}

export default async function ModelPage({ params }: PageProps<'/models/[slug]'>) {
  const { slug } = await params;
  const target = resolve(slug);
  if (!target) notFound();
  const catalog = await getCatalog();
  const products = productsForModels(catalog, target.models);
  const universal = filterProducts(catalog).filter((p) => !p.models?.length && !modelSpecific.has(p.categoryId));
  const path = modelPath(slug);
  const crumbs =
    target.family.id === slug
      ? [{ name: target.name, path }]
      : [{ name: target.family.name, path: modelPath(target.family.id) }, { name: target.name, path }];

  return (
    <>
      <Breadcrumbs items={[{ name: 'Shop by Model', path: modelPath(deviceFamilies[0].id) }, ...crumbs]} />
      <JsonLd data={itemListLd(`${target.name} accessories`, path, products)} />
      <div className="container-page space-y-10 pt-4">
        <PageHero
          eyebrow="Shop by Model"
          title={target.name}
          text={`Cases, screen protectors and accessories made to fit your ${target.name}.`}
        />
        <ProductListing title={`${target.name} Accessories`} products={products} />
        {universal.length > 0 && (
          <section>
            <SectionHeader title={`Also works with your ${target.name}`} />
            <ProductGrid products={universal.slice(0, 8)} />
          </section>
        )}
      </div>
    </>
  );
}
