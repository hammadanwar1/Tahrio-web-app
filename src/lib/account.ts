'use server';
// Customer sign-up / sign-in for the website, against the same API accounts as the mobile app.
// The API token is kept in an httpOnly cookie; a second, readable cookie holds the first name only.

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { PROFILE_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE } from './account-cookies';
import { normalizePhone } from './phone';

export type AccountFormState = { error?: string; values?: Record<string, string> } | undefined;

const API = (process.env.TAHRIO_API_URL ?? '').replace(/\/$/, '');

type ApiUser = { id: string; name: string };

/** POST to the API as the shopper: their device name, browser and IP go along for the login log. */
async function post(path: string, body: unknown, device: string) {
  if (!API) throw new Error('Accounts are not available right now. Please try again later.');
  const h = await headers();
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-client-platform': 'web',
      ...(device ? { 'x-client-device': device } : {}),
      'user-agent': h.get('user-agent') ?? '',
      ...(h.get('x-forwarded-for') ? { 'x-forwarded-for': h.get('x-forwarded-for')! } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; user?: ApiUser; error?: string; message?: string };
  if (!res.ok || !data.token || !data.user) throw new Error(data.error || data.message || 'Something went wrong. Please try again.');
  return { token: data.token, user: data.user };
}

async function startSession(token: string, user: ApiUser) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE });
  jar.set(PROFILE_COOKIE, encodeURIComponent(JSON.stringify({ name: user.name })), {
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

const field = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

export async function signupAction(_prev: AccountFormState, f: FormData): Promise<AccountFormState> {
  const values = { name: field(f, 'name'), email: field(f, 'email'), phone: field(f, 'phone'), device: field(f, 'device') };
  const password = String(f.get('password') ?? '');
  const fail = (error: string) => ({ error, values });

  if (values.name.length < 2) return fail('Please enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return fail('Please enter a valid email address.');
  const phone = normalizePhone(values.phone);
  if (!/^03\d{9}$/.test(phone)) return fail('Enter a valid mobile number, e.g. 0300-1234567.');
  if (password.length < 6) return fail('Password must be at least 6 characters.');
  if (password !== String(f.get('confirm') ?? '')) return fail('The two passwords do not match.');
  if (values.device.length < 2) return fail('Please enter the name of the device you are using.');

  try {
    const { token, user } = await post(
      '/auth/register',
      { name: values.name, email: values.email, phone, password, device: values.device.slice(0, 80) },
      values.device,
    );
    await startSession(token, user);
  } catch (err) {
    return fail((err as Error).message);
  }
  redirect('/account?welcome=1');
}

export async function loginAction(_prev: AccountFormState, f: FormData): Promise<AccountFormState> {
  const id = field(f, 'id');
  const values = { id };
  const password = String(f.get('password') ?? '');
  if (!id || !password) return { error: 'Enter your email or mobile number and your password.', values };
  const byEmail = id.includes('@');
  try {
    const { token, user } = await post(
      '/auth/login',
      byEmail ? { email: id.toLowerCase(), password } : { phone: normalizePhone(id), password },
      field(f, 'device'),
    );
    await startSession(token, user);
  } catch (err) {
    return { error: (err as Error).message, values };
  }
  redirect('/account');
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(PROFILE_COOKIE);
  redirect('/login');
}
