import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

import { productImage, productPath } from '@/lib/catalog-core';
import { compactCount, rs } from '@/lib/format';
import type { Product } from '@/lib/types';
import { CartLineButton, WishlistButton } from './product-actions';
import { ProductGlyph } from './product-glyph';

/** Figma component "ProductCard" — Card Dark tokens. */
export function ProductCard({ product: p, eager = false }: { product: Product; eager?: boolean }) {
  const image = productImage(p);
  const href = productPath(p);
  return (
    <article className="group relative flex flex-col gap-2.5 rounded-card bg-card p-2 pb-3 shadow-card">
      <div className="relative aspect-[149/140] overflow-hidden rounded-image bg-card-soft">
        {image ? (
          <Image
            src={image}
            alt={p.fullName}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-card-primary">
            <ProductGlyph kind={p.icon} className="size-14" />
          </div>
        )}
        {!!p.discount && (
          <span className="absolute left-2 top-2 rounded-full bg-card-inverse px-[9px] py-1 text-[11px] font-semibold text-white">
            -{p.discount}%
          </span>
        )}
        <WishlistButton productId={p.id} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1">
        <p className="text-[11px] text-card-muted">{p.label}</p>
        <h3 className="line-clamp-2 text-sm font-medium text-card-ink">
          {/* Stretched link: whole card is clickable, one crawlable anchor per product. */}
          <Link href={href} className="after:absolute after:inset-0 after:rounded-card">
            {p.name}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-xs">
          <Star aria-hidden className="size-[13px] fill-star text-star" />
          <span className="font-semibold text-card-ink">{p.rating.toFixed(1)}</span>
          <span className="text-card-muted">· {compactCount(p.sold)} sold</span>
          <span className="sr-only">, rated {p.rating} out of 5</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-card-primary">{rs(p.price)}</span>
            {!!p.discount && p.oldPrice && (
              <span className="text-[11px] text-card-muted line-through">
                <span className="sr-only">was </span>
                {rs(p.oldPrice)}
              </span>
            )}
          </p>
          <CartLineButton product={p} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, eagerCount = 0 }: { products: Product[]; eagerCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full">
            <ProductCard product={p} eager={i < eagerCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
