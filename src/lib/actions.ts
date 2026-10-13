'use server';
// Checkout + order tracking against the Tahrio API (guest checkout). The API base stays server-side.

import { getCatalog } from './catalog';
import { normalizePhone } from './phone';

const API = (process.env.TAHRIO_API_URL ?? '').replace(/\/$/, '');

export interface CheckoutLine {
  productId: string;
  qty: number;
  variant: string | null;
}

export interface CheckoutInput {
  lines: CheckoutLine[];
  name: string;
  phone: string;
  address: string;
  city: string;
  deliveryMethodId: 'standard' | 'express';
  paymentMethodId: 'cod' | 'jazzcash' | 'easypaisa' | 'card';
  promoCode: string | null;
}

export interface PlacedOrder {
  id: string;
  number: string;
  total: number;
  itemCount: number;
  paymentName: string;
  etaFrom: string;
  etaTo: string;
  /** Guest token needed to look the order up again (stored in the browser). */
  token: string;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Validates a promo code against the store's promo rules (no login needed). */
export async function validatePromoAction(code: string, subtotal: number): Promise<ActionResult<{ code: string; discount: number }>> {
  const { promos } = (await import('@/data/seed.json')).default as unknown as {
    promos: { code: string; type: string; amount: number; minSubtotal?: number }[];
  };
  const promo = promos.find((p) => p.code.toUpperCase() === code.trim().toUpperCase());
  if (!promo) return { ok: false, error: 'Invalid promo code' };
  if (subtotal < (promo.minSubtotal ?? 0)) return { ok: false, error: `Minimum order Rs ${promo.minSubtotal} for this code` };
  const discount = promo.type === 'percent' ? Math.round((subtotal * promo.amount) / 100) : promo.amount;
  return { ok: true, data: { code: promo.code, discount: Math.min(discount, subtotal) } };
}

export async function placeOrderAction(input: CheckoutInput): Promise<ActionResult<PlacedOrder>> {
  if (!API) {
    return { ok: false, error: 'Online checkout is not connected yet. Please order on WhatsApp — we deliver with cash on delivery.' };
  }
  const phone = normalizePhone(input.phone);
  if (input.name.trim().length < 2) return { ok: false, error: 'Please enter your full name.' };
  if (!/^03\d{9}$/.test(phone)) return { ok: false, error: 'Enter a valid mobile number, e.g. 0300-1234567.' };
  if (input.address.trim().length < 8 || !input.city.trim()) return { ok: false, error: 'Please enter your full delivery address and city.' };
  if (!input.lines.length) return { ok: false, error: 'Your cart is empty.' };

  // Only accept products/prices the store actually has (never trust client prices).
  const { products } = await getCatalog();
  const known = new Set(products.filter((p) => p.inStock).map((p) => p.id));
  const lines = input.lines.filter((l) => known.has(l.productId) && l.qty > 0 && l.qty <= 10);
  if (lines.length !== input.lines.length) return { ok: false, error: 'Some items in your cart are no longer available.' };

  try {
    const { token } = await call<{ token: string }>('/auth/guest', { method: 'POST', body: {} });
    for (const l of lines) {
      await call('/cart/items', { method: 'POST', token, body: { productId: l.productId, qty: l.qty, variant: l.variant } });
    }
    const address = await call<{ id: string }>('/addresses', {
      method: 'POST',
      token,
      body: { label: 'Home', name: input.name.trim(), phone, line: `${input.address.trim()}, ${input.city.trim()}`, isDefault: true },
    });
    const order = await call<{
      id: string;
      number: string;
      total: number;
      itemCount: number;
      payment: { name: string };
      etaFrom: string;
      etaTo: string;
    }>('/orders', {
      method: 'POST',
      token,
      body: {
        addressId: address.id,
        deliveryMethodId: input.deliveryMethodId,
        paymentMethodId: input.paymentMethodId,
        promoCode: input.promoCode,
      },
    });
    return {
      ok: true,
      data: {
        id: order.id,
        number: order.number,
        total: order.total,
        itemCount: order.itemCount,
        paymentName: order.payment.name,
        etaFrom: order.etaFrom,
        etaTo: order.etaTo,
        token,
      },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message || 'Could not place your order. Please try again.' };
  }
}

export interface TrackedOrder {
  number: string;
  status: string;
  createdAt: string;
  etaFrom: string;
  etaTo: string;
  total: number;
  courier: string;
  timeline: { step: string; at: string }[];
  items: { name: string; qty: number }[];
}

export async function getOrderAction(orderId: string, token: string): Promise<ActionResult<TrackedOrder>> {
  if (!API) return { ok: false, error: 'Order tracking is not connected yet.' };
  try {
    return { ok: true, data: await call<TrackedOrder>(`/orders/${encodeURIComponent(orderId)}`, { token }) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
