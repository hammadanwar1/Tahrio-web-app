'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { validatePromoAction } from '@/lib/actions';
import { rs } from '@/lib/format';
import type { LiveProduct } from '@/lib/live-products';
import { site } from '@/lib/site';
import { store, type CartLine } from '@/lib/store';
import { ProductGlyph } from './product-glyph';
import { useStore } from './store-provider';

export interface PricedLine extends CartLine {
  live: LiveProduct;
}

/** Cart lines joined with live catalog data (drops discontinued products). */
export function usePricedCart(live: Record<string, LiveProduct>) {
  const { cart, promoCode } = useStore();
  const lines: PricedLine[] = cart.flatMap((l) => (live[l.productId] ? [{ ...l, live: live[l.productId] }] : []));
  const subtotal = lines.reduce((s, l) => s + l.live.price * l.qty, 0);
  return { lines, subtotal, promoCode, count: lines.reduce((n, l) => n + l.qty, 0) };
}

export function CartView({ live }: { live: Record<string, LiveProduct> }) {
  const { lines, subtotal, promoCode, count } = usePricedCart(live);
  const [promo, setPromo] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number | null>(null);

  // Re-validate the remembered promo whenever the subtotal changes (min-order rules).
  useEffect(() => {
    if (!promoCode) return;
    let live = true;
    validatePromoAction(promoCode, subtotal).then((res) => {
      if (!live) return;
      if (res.ok) setDiscount(res.data.discount);
      else {
        store.setPromo(null);
        setDiscount(null);
        setPromoError(res.error);
      }
    });
    return () => {
      live = false;
    };
  }, [promoCode, subtotal]);

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center rounded-card border border-line bg-surface px-6 py-16 text-center">
        <span className="mb-5 flex size-24 items-center justify-center rounded-full bg-primary-soft text-primary">
          <ShoppingBag aria-hidden className="size-10" />
        </span>
        <h2 className="text-[22px] font-bold">Your cart is empty</h2>
        <p className="mt-2 text-muted">Add earbuds, chargers or a new case to get started.</p>
        <Link href="/" className="bg-gradient-button mt-8 rounded-button px-10 py-4 font-semibold text-white">
          Start shopping
        </Link>
      </div>
    );
  }

  const appliedDiscount = promoCode ? (discount ?? 0) : 0;
  const total = Math.max(0, subtotal + site.policy.standardDeliveryFee - appliedDiscount);

  async function applyPromo(code: string) {
    setPromoError(null);
    const res = await validatePromoAction(code, subtotal);
    if (res.ok) {
      store.setPromo(res.data.code);
      setDiscount(res.data.discount);
    } else {
      setPromoError(res.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <p className="text-sm text-muted">
          {count} {count === 1 ? 'item' : 'items'}
          <button type="button" onClick={() => store.clearCart()} className="ml-4 inline-flex items-center gap-1 text-danger hover:underline">
            <Trash2 aria-hidden className="size-4" /> Clear cart
          </button>
        </p>
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={`${l.productId}-${l.variant}`} className="flex items-center gap-4 rounded-card bg-surface p-3 shadow-card">
              <Link href={`/products/${l.live.slug}`} className="relative size-[76px] shrink-0 overflow-hidden rounded-image bg-primary-soft">
                {l.live.image ? (
                  <Image src={l.live.image} alt={l.live.name} fill sizes="76px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-primary">
                    <ProductGlyph kind={l.live.icon} className="size-8" />
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${l.live.slug}`} className="line-clamp-2 font-medium hover:text-primary">
                  {l.live.name}
                </Link>
                {l.variant && <p className="text-xs text-muted">{l.variant}</p>}
                <p className="mt-1 font-semibold text-primary">{rs(l.live.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={l.qty === 1 ? `Remove ${l.live.name}` : `Decrease ${l.live.name} quantity`}
                  onClick={() => store.setQty(l.productId, l.variant, l.qty - 1)}
                  className="flex size-8 items-center justify-center rounded-full border border-line"
                >
                  <Minus aria-hidden className="size-4" />
                </button>
                <span aria-label="Quantity" className="w-5 text-center font-semibold">
                  {l.qty}
                </span>
                <button
                  type="button"
                  aria-label={`Increase ${l.live.name} quantity`}
                  disabled={l.qty >= 10}
                  onClick={() => store.setQty(l.productId, l.variant, l.qty + 1)}
                  className="flex size-8 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
                >
                  <Plus aria-hidden className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (promo.trim()) void applyPromo(promo);
          }}
          className="flex items-center gap-2 rounded-card bg-surface p-2 pl-4 shadow-card"
        >
          <label htmlFor="promo" className="sr-only">
            Promo code
          </label>
          {promoCode ? (
            <>
              <span className="flex-1 font-medium">{promoCode}</span>
              <button
                type="button"
                onClick={() => {
                  store.setPromo(null);
                  setDiscount(null);
                }}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white"
                title="Remove promo code"
              >
                Applied
              </button>
            </>
          ) : (
            <>
              <input
                id="promo"
                value={promo}
                onChange={(e) => setPromo(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="h-10 flex-1 bg-transparent focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
                Apply
              </button>
            </>
          )}
        </form>
        {promoError && <p className="px-2 text-sm text-danger">{promoError}</p>}

        <dl className="space-y-3 rounded-card bg-surface p-5 text-sm shadow-card">
          <Row label="Subtotal" value={rs(subtotal)} />
          <Row label="Delivery (standard)" value={rs(site.policy.standardDeliveryFee)} />
          {appliedDiscount > 0 && <Row label={`Promo (${promoCode})`} value={<span className="text-success">- {rs(appliedDiscount)}</span>} />}
          <div className="border-t border-line pt-3">
            <Row label={<span className="text-base font-semibold text-ink">Total</span>} value={<span className="text-lg font-bold">{rs(total)}</span>} />
          </div>
        </dl>
        <Link href="/checkout" className="bg-gradient-button flex h-14 items-center justify-center rounded-button font-semibold text-white">
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
