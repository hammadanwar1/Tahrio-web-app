import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Banknote, RotateCcw, Star, Truck } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { AddToCartPanel, WishlistButton } from '@/components/product-actions';
import { ProductGrid } from '@/components/product-card';
import { ProductGlyph } from '@/components/product-glyph';
import { getCatalog } from '@/lib/catalog';
import {
  categoryPath,
  findProductBySlug,
  productImage,
  productPath,
  productSlug,
  relatedProducts,
  withDiscount,
} from '@/lib/catalog-core';
import { compactCount, rs } from '@/lib/format';
import { productLd } from '@/lib/jsonld';
import { pageMetadata, productTitle } from '@/lib/seo';
import { site } from '@/lib/site';

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
  return pageMetadata({
    title: productTitle(p),
    description: `Buy ${p.fullName} online in Pakistan for ${rs(p.price)}${
      p.oldPrice && p.discount ? ` (was ${rs(p.oldPrice)})` : ''
    }. ${p.description} Rated ${p.rating}/5. Cash on delivery, ${site.policy.returnDays}-day returns.`,
    path: productPath(p),
    image: false, // products/[slug]/opengraph-image.tsx
  });
}

export default async function ProductPage({ params }: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const found = findProductBySlug(catalog, slug);
  if (!found) notFound();

  const p = withDiscount(found);
  const category = catalog.categories.find((c) => c.id === p.categoryId);
  const reviews = catalog.reviews.filter((r) => r.productId === p.id);
  const related = relatedProducts(catalog, p);
  const image = productImage(p);

  return (
    <>
      <Breadcrumbs
        items={[
          ...(category ? [{ name: category.name, path: categoryPath(category) }] : []),
          { name: p.name, path: productPath(p) },
        ]}
      />
      <JsonLd data={productLd(p, category, reviews, catalog.priceValidUntil)} />

      <div className="container-page grid gap-8 pt-4 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-sheet bg-primary-soft">
            {image ? (
              <Image
                src={image}
                alt={`${p.fullName}${p.colors[0] ? ` in ${p.colors[0].name}` : ''}`}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
                preload
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="flex size-3/5 items-center justify-center rounded-full bg-white/70 text-primary">
                  <ProductGlyph kind={p.icon} className="size-1/2" />
                </span>
              </div>
            )}
            {!!p.discount && (
              <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">
                -{p.discount}%
              </span>
            )}
          </div>
          <WishlistButton productId={p.id} className="absolute right-4 top-4 !size-11" />
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {category && (
              <Link
                href={categoryPath(category)}
                className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary"
              >
                {p.label}
              </Link>
            )}
            <a href="#reviews" className="flex items-center gap-1 text-sm">
              <Star aria-hidden className="size-4 fill-star text-star" />
              <span className="font-semibold">{p.rating.toFixed(1)}</span>
              <span className="text-muted">({compactCount(p.reviews)} reviews)</span>
            </a>
          </div>
          <h1 className="text-[26px] font-bold leading-tight sm:text-[32px]">{p.fullName}</h1>
          <p className="flex flex-wrap items-center gap-3">
            <span className="text-[28px] font-bold text-primary">{rs(p.price)}</span>
            {!!p.discount && p.oldPrice && (
              <>
                <span className="text-lg text-muted line-through">
                  <span className="sr-only">Original price </span>
                  {rs(p.oldPrice)}
                </span>
                <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">-{p.discount}%</span>
              </>
            )}
          </p>
          <p className="text-[15px] leading-relaxed text-muted">{p.description}</p>

          <AddToCartPanel product={p} />

          <ul className="grid gap-3 rounded-card bg-bg p-4 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <Truck aria-hidden className="size-5 text-primary" />
              {p.freeDelivery ? 'Free delivery' : 'Delivery'} · {site.policy.deliveryDays.min}–
              {site.policy.deliveryDays.max} days
            </li>
            <li className="flex items-center gap-3">
              <Banknote aria-hidden className="size-5 text-primary" /> Cash on delivery available
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw aria-hidden className="size-5 text-primary" /> {site.policy.returnDays}-day free returns
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck aria-hidden className="size-5 text-primary" /> {p.inStock ? 'In stock' : 'Out of stock'} ·
              Original product
            </li>
          </ul>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-card border border-line bg-surface p-5 text-sm">
            <dt className="text-muted">Brand</dt>
            <dd>{site.name}</dd>
            {category && (
              <>
                <dt className="text-muted">Category</dt>
                <dd>
                  <Link href={categoryPath(category)} className="text-primary hover:underline">
                    {category.name}
                  </Link>
                </dd>
              </>
            )}
            {p.colors.length > 0 && (
              <>
                <dt className="text-muted">Colours</dt>
                <dd>{p.colors.map((c) => c.name).join(', ')}</dd>
              </>
            )}
            {p.tags.length > 0 && (
              <>
                <dt className="text-muted">Features</dt>
                <dd>{p.tags.join(', ')}</dd>
              </>
            )}
            <dt className="text-muted">SKU</dt>
            <dd>{p.id}</dd>
          </dl>
        </div>
      </div>

      <section id="reviews" className="container-page mt-14 max-w-4xl scroll-mt-32">
        <h2 className="mb-1 text-2xl font-bold">Customer reviews</h2>
        <p className="mb-5 flex items-center gap-2 text-sm text-muted">
          <Star aria-hidden className="size-4 fill-star text-star" />
          {p.rating.toFixed(1)} out of 5 · {compactCount(p.reviews)} ratings
        </p>
        {reviews.length ? (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-card border border-line bg-surface p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {r.userName}
                    {r.verified && (
                      <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                        Verified buyer
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-sm" aria-label={`Rated ${r.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className={`size-4 ${i < r.rating ? 'fill-star text-star' : 'text-line'}`}
                      />
                    ))}
                  </p>
                </div>
                <p className="text-[15px] leading-relaxed">{r.text}</p>
                <time dateTime={r.createdAt} className="mt-2 block text-xs text-muted">
                  {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeZone: 'Asia/Karachi' }).format(
                    new Date(r.createdAt),
                  )}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No written reviews yet.</p>
        )}
      </section>

      {related.length > 0 && (
        <section className="container-page mt-14">
          <h2 className="mb-4 text-2xl font-bold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
