'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { placeOrderAction, validatePromoAction, type CheckoutInput } from '@/lib/actions';
import { rs } from '@/lib/format';
import type { LiveProduct } from '@/lib/live-products';
import { site } from '@/lib/site';
import { store } from '@/lib/store';
import { saveOrder } from '@/lib/orders-local';
import { usePricedCart } from './cart-view';

const delivery = [
  { id: 'standard', name: 'Standard', desc: `${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} business days`, fee: site.policy.standardDeliveryFee },
  { id: 'express', name: 'Express', desc: 'Next-day delivery', fee: site.policy.expressDeliveryFee },
] as const;

const payments = [
  { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when your order arrives' },
  { id: 'jazzcash', name: 'JazzCash', desc: 'Mobile wallet' },
  { id: 'easypaisa', name: 'Easypaisa', desc: 'Mobile wallet' },
  { id: 'card', name: 'Debit / Credit Card', desc: 'Visa, Mastercard' },
] as const;

const field = 'h-12 w-full rounded-input border border-line bg-surface px-4 focus:border-primary focus:outline-none';

export function CheckoutForm({ live }: { live: Record<string, LiveProduct> }) {
  const router = useRouter();
  const { lines, subtotal, promoCode, count } = usePricedCart(live);
  const [deliveryId, setDeliveryId] = useState<CheckoutInput['deliveryMethodId']>('standard');
  const [paymentId, setPaymentId] = useState<CheckoutInput['paymentMethodId']>('cod');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!promoCode) return;
    validatePromoAction(promoCode, subtotal).then((r) => setPromoDiscount(r.ok ? r.data.discount : 0));
  }, [promoCode, subtotal]);
  const discount = promoCode ? promoDiscount : 0;

  if (!lines.length) {
    return (
      <p className="rounded-card border border-line bg-surface p-10 text-center text-muted">
        Your cart is empty.{' '}
        <Link href="/" className="font-medium text-primary">
          Continue shopping
        </Link>
      </p>
    );
  }

  const fee = delivery.find((d) => d.id === deliveryId)!.fee;
  const total = Math.max(0, subtotal + fee - discount);

  function submit(form: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await placeOrderAction({
        lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, variant: l.variant })),
        name: String(form.get('name') ?? ''),
        phone: String(form.get('phone') ?? ''),
        address: String(form.get('address') ?? ''),
        city: String(form.get('city') ?? ''),
        deliveryMethodId: deliveryId,
        paymentMethodId: paymentId,
        promoCode: discount ? promoCode : null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      saveOrder(res.data);
      store.clearCart();
      router.replace(`/order/success?id=${encodeURIComponent(res.data.id)}`);
    });
  }

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <fieldset className="space-y-3 rounded-card bg-surface p-5 shadow-card">
          <legend className="mb-2 text-lg font-bold">Delivery address</legend>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Full name</span>
            <input name="name" required autoComplete="name" className={field} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Mobile number</span>
            <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX-XXXXXXX" className={field} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Address</span>
            <input name="address" required autoComplete="street-address" placeholder="House, street, block / area" className={field} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">City</span>
            <input name="city" required autoComplete="address-level2" placeholder="Karachi" className={field} />
          </label>
        </fieldset>

        <RadioGroup legend="Delivery method" value={deliveryId} onChange={(v) => setDeliveryId(v as typeof deliveryId)}
          options={delivery.map((d) => ({ id: d.id, title: d.name, desc: d.desc, aside: d.fee ? rs(d.fee) : 'Free' }))} />
        <RadioGroup legend="Payment method" value={paymentId} onChange={(v) => setPaymentId(v as typeof paymentId)}
          options={payments.map((p) => ({ id: p.id, title: p.name, desc: p.desc }))} />
      </div>

      <aside className="h-fit space-y-4">
        <dl className="space-y-3 rounded-card bg-surface p-5 text-sm shadow-card">
          <Row label={`Items (${count})`} value={rs(subtotal)} />
          <Row label="Delivery" value={fee ? rs(fee) : <span className="text-success">Free</span>} />
          {discount > 0 && <Row label={`Promo (${promoCode})`} value={<span className="text-success">- {rs(discount)}</span>} />}
          <div className="border-t border-line pt-3">
            <Row label={<span className="text-base font-semibold text-ink">Total</span>} value={<span className="text-lg font-bold">{rs(total)}</span>} />
          </div>
        </dl>
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">
            {error}{' '}
            <a href={`https://wa.me/${site.whatsapp}`} className="font-semibold underline" rel="noopener" target="_blank">
              Order on WhatsApp
            </a>
          </p>
        )}
        <button type="submit" disabled={pending} className="bg-gradient-button flex h-14 w-full items-center justify-center rounded-button font-semibold text-white disabled:opacity-60">
          {pending ? 'Placing order…' : `Place Order · ${rs(total)}`}
        </button>
      </aside>
    </form>
  );
}

function RadioGroup({ legend, value, onChange, options }: {
  legend: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; title: string; desc: string; aside?: string }[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-lg font-bold">{legend}</legend>
      {options.map((o) => (
        <label key={o.id} className={`flex cursor-pointer items-center gap-4 rounded-card border bg-surface p-4 ${value === o.id ? 'border-[1.5px] border-primary' : 'border-line'}`}>
          <input type="radio" name={legend} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="size-5 accent-primary" />
          <span className="flex-1">
            <span className="block font-semibold">{o.title}</span>
            <span className="block text-xs text-muted">{o.desc}</span>
          </span>
          {o.aside && <span className={`text-sm font-semibold ${o.aside === 'Free' ? 'text-success' : ''}`}>{o.aside}</span>}
        </label>
      ))}
    </fieldset>
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
