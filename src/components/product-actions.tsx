'use client';

import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react';

import { productImage, productSlug } from '@/lib/catalog-core';
import { store } from '@/lib/store';
import type { ColorOption, Product } from '@/lib/types';
import { useStore, useToast } from './store-provider';

const variantFor = (p: Product, color?: ColorOption | null) =>
  [p.variantLabel, color?.name].filter(Boolean).join(' · ') || null;

function lineFor(p: Product, color?: ColorOption | null) {
  return {
    productId: p.id,
    slug: productSlug(p),
    name: p.name,
    price: p.price,
    image: productImage(p),
    icon: p.icon,
    variant: variantFor(p, color ?? p.colors[0]),
  };
}

export function WishlistButton({ productId, className = '' }: { productId: string; className?: string }) {
  const { wishlist } = useStore();
  const toast = useToast();
  const on = wishlist.includes(productId);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={() => {
        const added = store.toggleWishlist(productId);
        toast(
          added
            ? { message: 'Item added to wishlist', tone: 'info', action: { label: 'View', href: '/wishlist' } }
            : { message: 'Item removed from wishlist', tone: 'danger' },
        );
      }}
      className={`z-10 flex size-[30px] items-center justify-center rounded-full shadow-[0_4px_10px_rgba(23,20,31,0.1)] transition-colors ${
        on ? 'bg-card-primary' : 'bg-card'
      } ${className}`}
    >
      <Heart aria-hidden className={`size-4 text-white ${on ? 'fill-white' : ''}`} />
    </button>
  );
}

/** Round "+" on product cards. */
export function CartLineButton({ product }: { product: Product }) {
  const toast = useToast();
  if (!product.inStock) {
    return <span className="z-10 text-[11px] font-medium text-card-muted">Out of stock</span>;
  }
  return (
    <button
      type="button"
      aria-label={`Add ${product.name} to cart`}
      onClick={() => {
        store.addToCart(lineFor(product));
        toast({ message: `${product.name} added to cart`, tone: 'success', action: { label: 'View', href: '/cart' } });
      }}
      className="z-10 flex size-8 items-center justify-center rounded-full bg-card-primary text-white transition-transform active:scale-95"
    >
      <Plus aria-hidden className="size-4" />
    </button>
  );
}

/** Product detail: colour picker + qty stepper + Add to Cart. */
export function AddToCartPanel({ product }: { product: Product }) {
  const [color, setColor] = useState<ColorOption | null>(product.colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const toast = useToast();

  return (
    <div className="space-y-6">
      {product.colors.length > 0 && (
        <fieldset className="flex items-center gap-4">
          <legend className="sr-only">Colour</legend>
          <span aria-hidden className="text-[15px] font-medium">
            Color
          </span>
          <div className="flex gap-3">
            {product.colors.map((c) => (
              <label key={c.name} className="cursor-pointer" title={c.name}>
                <input
                  type="radio"
                  name="color"
                  value={c.name}
                  checked={color?.name === c.name}
                  onChange={() => setColor(c)}
                  className="peer sr-only"
                />
                <span className="sr-only">{c.name}</span>
                <span
                  aria-hidden
                  className="block size-8 rounded-full border border-line ring-primary ring-offset-2 peer-checked:ring-2 peer-focus-visible:ring-2"
                  style={{ background: c.hex }}
                />
              </label>
            ))}
          </div>
          <span className="text-sm text-muted">{color?.name}</span>
        </fieldset>
      )}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 rounded-full bg-bg p-1.5">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex size-11 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
          >
            <Minus aria-hidden className="size-5" />
          </button>
          <output aria-label="Quantity" className="w-8 text-center text-lg font-semibold">
            {qty}
          </output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={qty >= 10}
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            className="flex size-11 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40"
          >
            <Plus aria-hidden className="size-5" />
          </button>
        </div>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => {
            store.addToCart(lineFor(product, color), qty);
            toast({ message: `${product.name} added to cart`, tone: 'success', action: { label: 'View cart', href: '/cart' } });
          }}
          className="bg-gradient-button flex h-14 flex-1 items-center justify-center gap-2 rounded-button text-base font-semibold text-white disabled:opacity-50"
        >
          <ShoppingBag aria-hidden className="size-5" />
          {product.inStock ? 'Add to Cart' : 'Out of stock'}
        </button>
      </div>
    </div>
  );
}
