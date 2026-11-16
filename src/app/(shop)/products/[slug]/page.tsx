import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { BadgeCheck, CircleCheck, LockKeyhole, RotateCcw, ShieldCheck, Star, Truck } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { AddToCartPanel, WishlistButton } from '@/components/product-actions';
import { ProductGrid } from '@/components/product-card';
import { ProductGallery } from '@/components/product-gallery';
import { ProductMeta } from '@/components/product-meta';
import { ProductTabs } from '@/components/product-tabs';
import { FaqList } from '@/components/sections';
import { getCatalog } from '@/lib/catalog';
import {
  brandOf,
  brandPath,
  categoryPath,
  findProductBySlug,
  galleryImages,
  modelPath,
  productPath,
  productSlug,
  productVideo,
  relatedProducts,
  withDiscount,
} from '@/lib/catalog-core';
import { compactCount, rs } from '@/lib/format';
import { productLd } from '@/lib/jsonld';
import { pageMetadata, productTitle } from '@/lib/seo';
import { site } from '@/lib/site';
import type { Product } from '@/lib/types';

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ slug: productSlug(p) }));
}

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = findProductBySlug(catalog, slug);
  if (!product) notFound();
  const p = withDiscount(product);
  const category = catalog.categories.find((c) => c.id === p.categoryId);
  return pageMetadata({
    title: productTitle(p),
    description: `Buy ${p.fullName} online in Pakistan for ${rs(p.price)}${
      p.oldPrice && p.discount ? ` (was ${rs(p.oldPrice)})` : ''
    }. ${p.description} Rated ${p.rating}/5. Cash on delivery, ${site.policy.returnDays}-day returns.`,
    path: productPath(p),
    image: false, // products/[slug]/opengraph-image.tsx
    type: 'product',
    keywords: [
      `${p.fullName} price in Pakistan`,
      `${p.name} price in Pakistan`,
      `buy ${p.name} online in Pakistan`,
      ...(p.label ? [`${p.label} price in Pakistan`] : []),
      ...(category ? [`${category.name.toLowerCase()} in Pakistan`] : []),
      `${site.name} ${p.name}`,
    ],
  });
}

/** Questions every shopper asks before ordering, answered from the product and store policies. */
function productFaqs(p: Product, models: string[]) {
  return [
    {
      q: `Is the ${p.fullName} original?`,
      a: `Yes. ${site.name} only sells original products, checked before dispatch. If anything is wrong you can return it within ${site.policy.returnDays} days.`,
    },
    {
      q: 'How long does delivery take and what does it cost?',
      a: `Delivery anywhere in Pakistan takes ${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} working days and costs ${rs(site.policy.standardDeliveryFee)}.`,
    },
    { q: 'Can I pay cash on delivery?', a: 'Yes. Pay in cash when the parcel reaches you – no advance payment needed.' },
    ...(models.length
      ? [{ q: 'Which phone models does it fit?', a: `${models.join(', ')}. Pick your model before adding it to the cart.` }]
      : []),
    {
      q: 'What if I want to return or exchange it?',
      a: `You can return or exchange it within ${site.policy.returnDays} days of delivery. Message us on WhatsApp (${site.phone}) to start.`,
    },
  ];
}

const services = [
  { icon: ShieldCheck, label: 'Warranty' },
  { icon: Truck, label: 'Fast Delivery' },
  { icon: RotateCcw, label: 'Easy Returns' },
  { icon: BadgeCheck, label: 'Original Brands' },
];

export default async function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const found = findProductBySlug(catalog, slug);
  if (!found) notFound();

  const p = withDiscount(found);
  const category = catalog.categories.find((c) => c.id === p.categoryId);
  const reviews = catalog.reviews.filter((r) => r.productId === p.id);
  const related = relatedProducts(catalog, p);
  const brand = brandOf(p);
  const images = galleryImages(p);
  const video = productVideo(p);
  const models = p.models ?? [];
  const faqs = productFaqs(p, models);
  const alt = `${p.fullName}${p.colors[0] ? ` in ${p.colors[0].name}` : ''}`;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));

  const info: [string, ReactNode][] = [
    ['Brand', <Link key="b" href={brandPath(brand)} className="text-primary hover:underline">{brand}</Link>],
    ...(category
      ? [['Category', <Link key="c" href={categoryPath(category)} className="text-primary hover:underline">{category.name}</Link>] as [string, ReactNode]]
      : []),
    ...(p.colors.length ? [['Colours', p.colors.map((c) => c.name).join(', ')] as [string, ReactNode]] : []),
    ...(p.tags.length ? [['Features', p.tags.join(', ')] as [string, ReactNode]] : []),
    ['Condition', 'Brand new, original'],
    ['Availability', p.inStock ? 'In stock' : 'Out of stock'],
    ['Delivery', `${rs(site.policy.standardDeliveryFee)} · ${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} working days, all over Pakistan`],
    ['Payment', 'Cash on delivery'],
    ['Returns', `${site.policy.returnDays}-day easy returns`],
    ['SKU', p.id],
  ];

  return (
    <>
      <Breadcrumbs
        items={[
          ...(category ? [{ name: category.name, path: categoryPath(category) }] : []),
          { name: p.name, path: productPath(p) },
        ]}
      />
      <JsonLd data={productLd(p, category, reviews, catalog.priceValidUntil, catalog.fetchedAt.slice(0, 10))} />
      <ProductMeta product={p} />

      <div className="container-page grid gap-6 pt-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* Left: gallery, services, highlights, FAQs */}
        <div className="space-y-6">
          <div className="relative rounded-sheet border border-line bg-surface p-3 sm:p-4">
            <ProductGallery images={images} video={video} alt={alt} icon={p.icon} />
            {!!p.discount && (
              <span className="bg-gradient-button absolute left-7 top-7 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow">
                {p.discount}% OFF
              </span>
            )}
            <WishlistButton productId={p.id} className="absolute right-7 top-7 !size-11" />
          </div>

          <ul className="grid grid-cols-4 rounded-sheet border border-line bg-surface py-5">
            {services.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 border-r border-line px-1 text-center last:border-r-0">
                <Icon aria-hidden className="size-8 text-primary" strokeWidth={1.5} />
                <span className="text-[11px] font-bold uppercase tracking-wide sm:text-xs">{label}</span>
              </li>
            ))}
          </ul>

          {!!p.highlights?.length && (
            <section className="rounded-sheet border border-line bg-surface p-5 sm:p-6">
              <h2 className="mb-3 text-lg font-bold">Key highlights</h2>
              <ul className="space-y-2 text-[15px]">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5">
                    <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-bold">Frequently Asked Questions</h2>
            <FaqList faqs={faqs} />
          </section>
        </div>

        {/* Right: buy box */}
        <div className="space-y-5 self-start rounded-sheet border border-line bg-surface p-5 sm:p-8 lg:sticky lg:top-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={brandPath(brand)} className="bg-gradient-button bg-clip-text text-lg font-bold tracking-tight text-transparent">
              {brand}
            </Link>
            {category && (
              <Link href={categoryPath(category)} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
                {category.name}
              </Link>
            )}
          </div>
          <h1 className="text-[26px] font-bold leading-tight sm:text-[30px]">{p.fullName}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            {p.reviews > 0 ? (
              <a href="#product-info" className="flex items-center gap-1">
                <Star aria-hidden className="size-4 fill-star text-star" />
                <span className="font-semibold">{p.rating.toFixed(1)}</span>
                <span className="text-muted">({compactCount(p.reviews)} reviews)</span>
              </a>
            ) : (
              <span />
            )}
            <span className={`font-semibold ${p.inStock ? 'text-success' : 'text-danger'}`}>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
          </div>
          <p className="flex flex-wrap items-center gap-3">
            <span className="text-[30px] font-bold text-primary">{rs(p.price)}</span>
            {!!p.discount && p.oldPrice && (
              <>
                <span className="text-lg text-muted line-through">
                  <span className="sr-only">Original price </span>
                  {rs(p.oldPrice)}
                </span>
                <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                  You save {rs(p.oldPrice - p.price)}
                </span>
              </>
            )}
          </p>
          <p className="text-[15px] leading-relaxed text-muted">{p.description}</p>

          <AddToCartPanel product={p} />

          <div className="bg-gradient-hero rounded-card p-5 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Pay when it arrives</p>
            <p className="mt-1 text-2xl font-bold">Cash on Delivery</p>
            <p className="mt-1 text-sm text-white/85">
              All over Pakistan · {rs(site.policy.standardDeliveryFee)} delivery · {site.policy.returnDays}-day returns
            </p>
          </div>
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-muted">
            <LockKeyhole aria-hidden className="size-4" /> Safe &amp; secure ordering
          </p>
        </div>
      </div>

      {/* Tabs */}
      <section id="product-info" className="container-page mt-14 scroll-mt-32">
        <ProductTabs
          tabs={[
            {
              id: 'description',
              label: 'Description',
              content: (
                <div className="mx-auto max-w-4xl space-y-6">
                  <h2 className="text-2xl font-bold sm:text-[28px]">{p.fullName} in Pakistan</h2>
                  <p className="text-[15px] leading-relaxed">{p.description}</p>
                  {!!p.highlights?.length && (
                    <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
                      {p.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                  {models.length > 0 && (
                    <div>
                      <h3 className="mb-2 font-bold">Compatibility</h3>
                      <ul className="flex flex-wrap gap-2">
                        {models.map((m) => (
                          <li key={m}>
                            <Link
                              href={modelPath(m)}
                              className="block rounded-full border border-line bg-surface px-3 py-1 text-sm hover:border-primary hover:text-primary"
                            >
                              {m}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {video && (
                    <video src={video} controls preload="metadata" playsInline poster={images[0]} className="w-full rounded-sheet bg-ink" />
                  )}
                  {images.length > 0 && (
                    <div className="space-y-4">
                      {images.map((src, i) => (
                        <Image
                          key={src}
                          src={src}
                          alt={`${p.fullName} – photo ${i + 1}`}
                          width={1200}
                          height={1200}
                          sizes="(min-width: 1024px) 896px, 100vw"
                          className="h-auto w-full rounded-sheet"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: 'specification',
              label: 'Specification',
              content: p.specs?.length ? (
                <SpecTable rows={p.specs.map((s) => [s.key, s.value])} />
              ) : (
                <SpecTable rows={info.filter(([k]) => ['Brand', 'Category', 'Colours', 'Features', 'Condition'].includes(k))} />
              ),
            },
            {
              id: 'reviews',
              label: `Reviews (${reviews.length})`,
              content: (
                <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
                  <div className="h-fit rounded-sheet border border-line bg-surface p-6 text-center">
                    <p className="text-5xl font-bold">{p.rating.toFixed(1)}</p>
                    <Stars rating={Math.round(p.rating)} className="mt-2 justify-center" />
                    <p className="mt-1 text-sm text-muted">Based on {compactCount(p.reviews)} ratings</p>
                    {reviews.length > 0 && (
                      <ul className="mt-5 space-y-1.5 text-left">
                        {breakdown.map((b) => (
                          <li key={b.stars} className="flex items-center gap-2 text-xs">
                            <span className="w-3">{b.stars}</span>
                            <Star aria-hidden className="size-3 fill-star text-star" />
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                              <span className="bg-gradient-button block h-full" style={{ width: `${(b.count / reviews.length) * 100}%` }} />
                            </span>
                            <span className="w-5 text-right text-muted">{b.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {reviews.length ? (
                    <ul className="grid gap-4 sm:grid-cols-2">
                      {reviews.map((r) => (
                        <li key={r.id} className="rounded-card border border-line bg-surface p-5">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{r.userName}</p>
                              {r.verified && <p className="text-xs font-medium text-success">Verified buyer</p>}
                            </div>
                            <Stars rating={r.rating} />
                          </div>
                          <p className="text-[15px] leading-relaxed">{r.text}</p>
                          <time dateTime={r.createdAt} className="mt-2 block text-xs text-muted">
                            {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeZone: 'Asia/Karachi' }).format(new Date(r.createdAt))}
                          </time>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No written reviews yet.</p>
                  )}
                </div>
              ),
            },
            { id: 'info', label: 'Additional Information', content: <SpecTable rows={info} /> },
          ]}
        />
      </section>

      {related.length > 0 && (
        <section className="container-page mt-14">
          <h2 className="mb-4 text-center text-2xl font-bold">You May Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}

function SpecTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mx-auto max-w-4xl overflow-hidden rounded-sheet border border-line bg-surface text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(120px,1fr)_2fr] border-b border-line last:border-b-0 even:bg-bg/60">
          <dt className="px-5 py-3 font-semibold">{k}</dt>
          <dd className="px-5 py-3 text-muted">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`flex shrink-0 gap-0.5 ${className}`} role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden className={`size-4 ${i < rating ? 'fill-star text-star' : 'text-line'}`} />
      ))}
    </span>
  );
}
