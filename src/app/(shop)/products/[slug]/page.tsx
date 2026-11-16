import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { BadgeCheck, Banknote, RotateCcw, Star, Truck } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { AddToCartPanel, WishlistButton } from '@/components/product-actions';
import { ProductGrid } from '@/components/product-card';
import { ProductGallery } from '@/components/product-gallery';
import { ProductMeta } from '@/components/product-meta';
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

      <div className="container-page grid gap-6 pt-4 lg:grid-cols-2 lg:gap-8">
        {/* Gallery */}
        <div className="relative self-start rounded-sheet border border-line bg-surface p-3 sm:p-4 lg:sticky lg:top-20">
          <ProductGallery
            images={galleryImages(p)}
            alt={`${p.fullName}${p.colors[0] ? ` in ${p.colors[0].name}` : ''}`}
            icon={p.icon}
          />
          {!!p.discount && (
            <span className="bg-gradient-button absolute left-7 top-7 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow">
              {p.discount}% OFF
            </span>
          )}
          <WishlistButton productId={p.id} className="absolute right-7 top-7 !size-11" />
        </div>

        {/* Details */}
        <div className="space-y-5 self-start rounded-sheet border border-line bg-surface p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={brandPath(brand)}
              className="bg-gradient-button bg-clip-text text-lg font-bold tracking-tight text-transparent"
            >
              {brand}
            </Link>
            {category && (
              <Link href={categoryPath(category)} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
                {category.name}
              </Link>
            )}
          </div>
          <h1 className="text-[26px] font-bold leading-tight sm:text-[32px]">{p.fullName}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            {p.reviews > 0 ? (
              <a href="#reviews" className="flex items-center gap-1">
                <Star aria-hidden className="size-4 fill-star text-star" />
                <span className="font-semibold">{p.rating.toFixed(1)}</span>
                <span className="text-muted">({compactCount(p.reviews)} reviews)</span>
              </a>
            ) : (
              <span />
            )}
            <span className={`font-semibold ${p.inStock ? 'text-success' : 'text-danger'}`}>
              {p.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <p className="flex flex-wrap items-center gap-3">
            <span className="text-[30px] font-bold text-primary">{rs(p.price)}</span>
            {!!p.discount && p.oldPrice && (
              <span className="text-lg text-muted line-through">
                <span className="sr-only">Original price </span>
                {rs(p.oldPrice)}
              </span>
            )}
            {!!p.discount && p.oldPrice && (
              <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                You save {rs(p.oldPrice - p.price)}
              </span>
            )}
          </p>
          <p className="text-[15px] leading-relaxed text-muted">{p.description}</p>

          <AddToCartPanel product={p} />

          <ul className="grid gap-3 rounded-card bg-bg p-4 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-3">
              <Truck aria-hidden className="size-5 text-primary" />
              Delivery {rs(site.policy.standardDeliveryFee)} · {site.policy.deliveryDays.min}–{site.policy.deliveryDays.max} days
            </li>
            <li className="flex items-center gap-3">
              <Banknote aria-hidden className="size-5 text-primary" /> Cash on delivery available
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw aria-hidden className="size-5 text-primary" /> {site.policy.returnDays}-day easy returns
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck aria-hidden className="size-5 text-primary" /> 100% original product
            </li>
          </ul>
        </div>
      </div>

      <section className="container-page mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Product details</h2>
          <p className="text-[15px] leading-relaxed">{p.description}</p>
          {!!p.highlights?.length && (
            <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
              {p.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          {!!p.models?.length && (
            <div>
              <h3 className="mb-2 font-semibold">Compatible with</h3>
              <ul className="flex flex-wrap gap-2">
                {p.models.map((m) => (
                  <li key={m}>
                    <Link href={modelPath(m)} className="block rounded-full border border-line px-3 py-1 text-sm hover:border-primary hover:text-primary">
                      {m}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <dl className="grid h-fit grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-card border border-line bg-surface p-5 text-sm">
          <dt className="text-muted">Brand</dt>
          <dd>
            <Link href={brandPath(brand)} className="text-primary hover:underline">
              {brand}
            </Link>
          </dd>
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
          {p.specs?.map((s) => (
            <Fragment key={s.key}>
              <dt className="text-muted">{s.key}</dt>
              <dd>{s.value}</dd>
            </Fragment>
          ))}
          <dt className="text-muted">SKU</dt>
          <dd>{p.id}</dd>
        </dl>
      </section>

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
