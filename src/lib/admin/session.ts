// Admin session: an HMAC-signed, httpOnly cookie holding only its expiry time. There is a single
// admin login (ADMIN_PASSWORD); every admin read and write goes through requireAdmin().
import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'tahrio_admin';
const MAX_AGE_S = 12 * 60 * 60;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('ADMIN_SESSION_SECRET must be set (32+ characters)');
  return s;
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

function safeEqual(a: string, b: string) {
  // Hash first so lengths always match and the comparison stays constant-time.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** True when the admin login is configured (ADMIN_PASSWORD + ADMIN_SESSION_SECRET). */
export const adminConfigured = () =>
  Boolean(process.env.ADMIN_PASSWORD && (process.env.ADMIN_SESSION_SECRET ?? '').length >= 32);

export function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(password, expected!);
}

export async function createSession() {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: MAX_AGE_S,
  });
}

export async function deleteSession() {
  (await cookies()).delete({ name: COOKIE, path: '/admin' });
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !adminConfigured()) return false;
  const [exp, mac] = value.split('.');
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false;
  return Number(exp) > Date.now();
}

/** Redirects to the login page unless the request carries a valid admin session. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}
