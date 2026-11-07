// Server-side client for the Tahrio admin API. The admin key never leaves the server, and every
// call re-checks the admin session (layouts alone are not an auth boundary).
import 'server-only';

import type { Category, Product } from '@/lib/types';
import { requireAdmin } from './session';

const API = (process.env.TAHRIO_API_URL ?? '').replace(/\/$/, '');

export class AdminApiError extends Error {}

export async function adminFetch<T>(path: string, init: { method?: string; body?: unknown; raw?: Blob } = {}): Promise<T> {
  await requireAdmin();
  const key = process.env.TAHRIO_ADMIN_KEY;
  if (!API || !key) throw new AdminApiError('Set TAHRIO_API_URL and TAHRIO_ADMIN_KEY to use the admin panel.');

  let res: Response;
  try {
    res = await fetch(`${API}/admin${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'x-admin-key': key,
        ...(init.raw ? { 'content-type': init.raw.type } : init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: init.raw ?? (init.body === undefined ? undefined : JSON.stringify(init.body)),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new AdminApiError(`Can't reach the Tahrio API at ${API}. Is the backend running?`);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new AdminApiError(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

/** GET for pages: API failures become a message to show instead of crashing the page. */
export async function loadAdmin<T>(path: string): Promise<{ data: T; error?: never } | { data?: never; error: string }> {
  try {
    return { data: await adminFetch<T>(path) };
  } catch (err) {
    if (err instanceof AdminApiError) return { error: err.message };
    throw err;
  }
}

// ---------- response shapes (only the fields the panel uses) ----------

export interface Stat {
  value: number;
  change: number | null;
}

export interface Dashboard {
  stats: { sales: Stat; orders: Stat; customers: Stat & { new: number }; products: { value: number; lowStock: number } };
  sales: { range: string; series: { label: string; total: number; orders: number }[]; total: number; avgOrder: number };
  recentOrders: AdminOrder[];
  online: number;
  pendingOrders: number;
}

export interface AdminOrder {
  id: string;
  number: string;
  userId: string;
  createdAt: string;
  status: string;
  total: number;
  itemCount: number;
  items: { productId: string; name: string; qty: number; price: number; variant: string | null }[];
  address?: { name?: string; phone?: string; line?: string } | null;
  payment: { name: string };
}

export type AdminProduct = Product & {
  status: 'draft' | 'published';
  stock: number | null;
  sku?: string;
  brand?: string;
  effective: { price: number; oldPrice: number | null; discount: number };
};

export type AdminCategory = Category & { itemCount: number };

export interface AdminUser {
  id: string;
  name: string;
  phone: string | null;
  email?: string;
  isGuest: boolean;
  blocked: boolean;
  online: boolean;
  orders: number;
  spent: number;
  lastLogin: string | null;
}
