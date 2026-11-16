import 'server-only';

import { cookies } from 'next/headers';

import { SESSION_COOKIE } from './account-cookies';

const API = (process.env.TAHRIO_API_URL ?? '').replace(/\/$/, '');

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  device?: string | null;
  createdAt?: string;
}

/** Signed-in customer's profile from the API, or null (no / expired session). */
export async function currentCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !API) return null;
  const res = await fetch(`${API}/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  return res?.ok ? ((await res.json()) as Customer) : null;
}
