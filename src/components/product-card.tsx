import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

import { productImage, productPath } from '@/lib/catalog-core';
import { compactCount, rs } from '@/lib/format';
import type { Product } from '@/lib/types';
import { CartLineButton, WishlistButton } from './product-actions';
import { ProductGlyph } from './product-glyph';

/** Store product card: photo with sale / new badges, name, prices, rating and Add to Cart. */
export function ProductCard({ product: p, eager = false }: { product: Product; eager?: boolean }) {
  const image = productImage(p);
  const href = productPath(p);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-nav">
      <div className="relative m-2 mb-0 aspect-square overflow-hidden rounded-image bg-primary-soft">
        {image ? (
          <Image
            src={image}
            alt={p.fullName}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <ProductGlyph kind={p.icon} className="size-14" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {!!p.discount && (
            <span className="bg-gradient-button rounded-full px-2.5 py-1 text-xs font-bold text-white shadow">
              {p.discount}% OFF
            </span>
          )}
          {p.isNew && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">NEW</span>}
        </div>
        <WishlistButton productId={p.id} className="absolute right-2 top-2" />
        {!p.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm leading-snug sm:text-[15px]">
          {/* Stretched link: whole card is clickable, one crawlable anchor per product. */}
          <Link href={href} className="after:absolute after:inset-0 after:rounded-card">
            {p.fullName}
          </Link>
        </h3>
        <p className="text-lg font-bold text-primary">{rs(p.price)}</p>
        <div className="flex min-h-6 items-center justify-between gap-2">
          {!!p.discount && p.oldPrice ? (
            <span className="text-xs text-muted line-through">
              <span className="sr-only">was </span>
              {rs(p.oldPrice)}
            </span>
          ) : (
            <span className="text-xs text-muted">{compactCount(p.sold)} sold</span>
          )}
          {p.reviews > 0 && (
            <span className="flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-xs">
              {p.rating.toFixed(1)}
              <Star aria-hidden className="size-3 fill-star text-star" />
              <span className="text-muted">({compactCount(p.reviews)})</span>
              <span className="sr-only">rated {p.rating} out of 5</span>
            </span>
          )}
        </div>
        <div className="mt-auto pt-2">
          <CartLineButton product={p} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  eagerCount = 0,
  className = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: {
  products: Product[];
  eagerCount?: number;
  className?: string;
}) {
  return (
    <ul className={`grid gap-3 sm:gap-5 ${className}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
