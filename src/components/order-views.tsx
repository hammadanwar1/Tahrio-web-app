'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';

import { getOrderAction, type PlacedOrder, type TrackedOrder } from '@/lib/actions';
import { rs } from '@/lib/format';
import { savedOrders } from '@/lib/orders-local';

const dateFmt = new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' });
const timeFmt = new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Karachi' });

const noop = () => () => {};
function useSavedOrders(): PlacedOrder[] | null {
  // null during SSR/hydration, then the browser's saved orders.
  const json = useSyncExternalStore(noop, () => JSON.stringify(savedOrders()), () => null);
  return json === null ? null : (JSON.parse(json) as PlacedOrder[]);
}

/** Figma 11 · Order Success */
export function OrderSuccess() {
  const id = useSearchParams().get('id');
  const orders = useSavedOrders();
  if (orders === null) return null;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return (
      <p className="text-center text-muted">
        Order not found on this device. <Link href="/track-order" className="text-primary">Track an order</Link>
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex size-36 items-center justify-center rounded-full bg-primary-soft">
        <span className="flex size-[84px] items-center justify-center rounded-full bg-primary text-white">
          <Check aria-hidden className="size-10" strokeWidth={3} />
        </span>
      </span>
      <h1 className="mt-6 text-[28px] font-bold">Order placed!</h1>
      <p className="mt-2 max-w-sm text-muted">Thanks for shopping with Tahrio. We&apos;ll message you when your order ships.</p>
      <dl className="mt-8 w-full space-y-3 rounded-card bg-surface p-5 text-left text-sm shadow-card">
        <Row label="Order ID" value={`#${order.number}`} />
        <Row label="Estimated delivery" value={`${dateFmt.format(new Date(order.etaFrom))} – ${dateFmt.format(new Date(order.etaTo))}`} />
        <Row label="Payment" value={order.paymentName} />
        <div className="border-t border-line pt-3">
          <Row label={<span className="text-base font-semibold text-ink">Amount</span>} value={<span className="text-lg font-bold">{rs(order.total)}</span>} />
        </div>
      </dl>
      <Link href={`/track-order?id=${encodeURIComponent(order.id)}`} className="bg-gradient-button mt-8 flex h-14 w-full items-center justify-center rounded-button font-semibold text-white">
        Track Order
      </Link>
      <Link href="/" className="mt-3 flex h-14 w-full items-center justify-center rounded-button border border-line bg-surface font-semibold">
        Continue Shopping
      </Link>
    </div>
  );
}

const steps = [
  ['placed', 'Order placed'],
  ['confirmed', 'Order confirmed'],
  ['packed', 'Packed & ready to ship'],
  ['out_for_delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
] as const;

/** Figma 12 · Order Tracking — orders placed from this browser. */
export function TrackOrders() {
  const selected = useSearchParams().get('id');
  const orders = useSavedOrders();
  if (orders === null) return null;
  if (!orders.length) {
    return (
      <p className="rounded-card border border-line bg-surface p-6 text-muted">
        No orders from this device yet. If you ordered on another phone or by WhatsApp, <Link href="/contact" className="font-medium text-primary">contact us</Link> with your order ID.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <TrackedOrderCard order={o} open={selected ? selected === o.id : orders[0].id === o.id} />
        </li>
      ))}
    </ul>
  );
}

function TrackedOrderCard({ order, open }: { order: PlacedOrder; open: boolean }) {
  const [data, setData] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    getOrderAction(order.id, order.token).then((r) => (r.ok ? setData(r.data) : setError(r.error)));
  }, [open, order.id, order.token]);

  const current = data ? steps.findIndex(([k]) => k === data.status) : -1;
  return (
    <details open={open} className="rounded-card bg-surface p-5 shadow-card">
      <summary className="flex cursor-pointer items-center justify-between">
        <span className="font-semibold">#{order.number}</span>
        <span className="text-sm text-muted">{rs(order.total)}</span>
      </summary>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {data && (
        <>
          <div className="bg-gradient-hero mt-4 rounded-card p-5 text-white">
            <p className="text-sm text-white/80">Estimated delivery</p>
            <p className="text-2xl font-bold">{dateFmt.format(new Date(data.etaTo))}</p>
            <p className="text-sm text-white/80">
              Courier: {data.courier} · {data.items.reduce((n, i) => n + i.qty, 0)} items
            </p>
          </div>
          <ol className="mt-5 space-y-5">
            {steps.map(([key, title], i) => {
              const done = i < current || data.status === 'delivered';
              const now = i === current && data.status !== 'delivered';
              const at = data.timeline.find((t) => t.step === key)?.at;
              return (
                <li key={key} className="flex gap-4">
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                      done ? 'bg-primary text-white' : now ? 'bg-primary-soft' : 'border-2 border-line'
                    }`}
                  >
                    {done ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : now ? <span className="size-2.5 rounded-full bg-primary" /> : null}
                  </span>
                  <span>
                    <span className={`block font-semibold ${done || now ? '' : 'text-muted'}`}>{title}</span>
                    <span className={`block text-xs ${now ? 'text-primary' : 'text-muted'}`}>
                      {done && at ? timeFmt.format(new Date(at)) : now ? 'In progress' : key === 'out_for_delivery' ? `Expected ${dateFmt.format(new Date(data.etaTo))}` : '—'}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </details>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
