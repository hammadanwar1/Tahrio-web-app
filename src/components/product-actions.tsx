'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react';

import { productImage, productPath, productSlug } from '@/lib/catalog-core';
import { rs } from '@/lib/format';
import { absoluteUrl, site } from '@/lib/site';
import { store } from '@/lib/store';
import type { ColorOption, Product } from '@/lib/types';
import { SocialIcon, whatsappUrl } from './social-icons';
import { useStore, useToast } from './store-provider';

// The chosen phone model replaces the product's fixed variant label (e.g. "iPhone 15").
const variantFor = (p: Product, color?: ColorOption | null, model?: string | null) =>
  [model ?? p.variantLabel, color?.name].filter(Boolean).join(' · ') || null;

function lineFor(p: Product, color?: ColorOption | null, model?: string | null) {
  return {
    productId: p.id,
    slug: productSlug(p),
    name: p.name,
    price: p.price,
    image: productImage(p),
    icon: p.icon,
    variant: variantFor(p, color ?? p.colors[0], model),
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
      className={`z-10 flex size-9 items-center justify-center rounded-full shadow-[0_4px_10px_rgba(23,20,31,0.12)] transition-colors ${
        on ? 'bg-gradient-button text-white' : 'bg-surface text-ink hover:text-accent'
      } ${className}`}
    >
      <Heart aria-hidden className={`size-[18px] ${on ? 'fill-white' : ''}`} />
    </button>
  );
}

/**
 * Full-width "Add to Cart" on product cards. Products sold per phone model need the model picked
 * first, so for those it opens the product page instead.
 */
export function CartLineButton({ product }: { product: Product }) {
  const toast = useToast();
  const base =
    'relative z-10 flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-transform active:scale-[.98]';
  if (!product.inStock) {
    return <span className={`${base} bg-bg text-muted`}>Out of stock</span>;
  }
  if (product.models?.length) {
    return (
      <Link href={productPath(product)} className={`${base} bg-ink text-white`}>
        Select Model
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={`Add ${product.name} to cart`}
      onClick={() => {
        store.addToCart(lineFor(product));
        toast({ message: `${product.name} added to cart`, tone: 'success', action: { label: 'View', href: '/cart' } });
      }}
      className={`${base} bg-gradient-button text-white`}
    >
      <ShoppingBag aria-hidden className="size-4" />
      Add to Cart
    </button>
  );
}

/** Product detail: phone model + colour pickers, qty stepper, Add to Cart and 1-click WhatsApp order. */
export function AddToCartPanel({ product }: { product: Product }) {
  const models = product.models ?? [];
  const [model, setModel] = useState<string | null>(models.length === 1 ? models[0] : null);
  const [color, setColor] = useState<ColorOption | null>(product.colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  /** False (and says why) while a phone model still has to be picked. */
  const ready = () => {
    if (models.length && !model) {
      setError('Please select your phone model first.');
      return false;
    }
    setError(null);
    return true;
  };

  const oneClickBuy = () => {
    if (!ready()) return;
    const variant = variantFor(product, color, model);
    const message = [
      `*Order request – ${site.name}*`,
      '',
      `${product.fullName}${variant ? ` (${variant})` : ''} × ${qty} = ${rs(product.price * qty)}`,
      absoluteUrl(productPath(product)),
      '',
      `Delivery: ${rs(site.policy.standardDeliveryFee)} · Payment: Cash on Delivery`,
      '',
      'My name:',
      'Phone:',
      'Full address & city:',
    ].join('\n');
    window.location.href = whatsappUrl(message);
  };

  return (
    <div className="space-y-5">
      {models.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">
            Phone Model: <span className="font-normal text-muted">{model ?? 'select one'}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <label key={m} className="cursor-pointer">
                <input
                  type="radio"
                  name="model"
                  value={m}
                  checked={model === m}
                  onChange={() => {
                    setModel(m);
                    setError(null);
                  }}
                  className="peer sr-only"
                />
                <span className="block rounded-xl border-2 border-line px-3.5 py-2 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:font-semibold peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                  {m}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">
            Colour: <span className="font-normal text-muted">{color?.name}</span>
          </legend>
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
        </fieldset>
      )}

      <div>
        <p className="mb-2.5 text-sm font-semibold">Quantity:</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-14 items-center rounded-full border-2 border-line px-1.5">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex size-10 items-center justify-center rounded-full hover:bg-bg disabled:opacity-40"
            >
              <Minus aria-hidden className="size-5" />
            </button>
            <output aria-label="Quantity" className="w-10 text-center text-lg font-semibold">
              {qty}
            </output>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={qty >= 10}
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              className="flex size-10 items-center justify-center rounded-full hover:bg-bg disabled:opacity-40"
            >
              <Plus aria-hidden className="size-5" />
            </button>
          </div>
          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => {
              if (!ready()) return;
              store.addToCart(lineFor(product, color, model), qty);
              toast({ message: `${product.name} added to cart`, tone: 'success', action: { label: 'View cart', href: '/cart' } });
            }}
            className="bg-gradient-button flex h-14 min-w-48 flex-1 items-center justify-center gap-2 rounded-full text-base font-bold uppercase tracking-wide text-white disabled:opacity-50"
          >
            <ShoppingBag aria-hidden className="size-5" />
            {product.inStock ? 'Add to Cart' : 'Out of stock'}
          </button>
        </div>
      </div>

      {product.inStock && (
        <button
          type="button"
          onClick={oneClickBuy}
          className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-ink text-base font-bold uppercase tracking-wide text-white hover:bg-ink/90"
        >
          <SocialIcon name="whatsapp" className="size-5 text-[#25d366]" />
          1-Click Buy on WhatsApp
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
