import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LogOut } from 'lucide-react';

import { logoutAction } from '@/lib/account';
import { currentCustomer } from '@/lib/account-user';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'My Account',
  description: 'Your Tahrio account.',
  path: '/account',
  noindex: true,
});

// Per-shopper page (session cookie): nothing to prerender for instant navigation.
export const instant = false;

export default function AccountPage({ searchParams }: PageProps<'/account'>) {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl rounded-sheet border border-line bg-surface p-6 shadow-card sm:p-10">
        <Suspense fallback={<p className="text-muted">Loading your account…</p>}>
          <AccountDetails searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function AccountDetails({ searchParams }: { searchParams: PageProps<'/account'>['searchParams'] }) {
  const [me, { welcome }] = await Promise.all([currentCustomer(), searchParams]);
  if (!me) redirect('/login');

  const rows = [
    ['Name', me.name],
    ['Mobile', me.phone],
    ['Email', me.email],
    ['Signed up on', me.device],
    [
      'Member since',
      me.createdAt
        ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeZone: 'Asia/Karachi' }).format(new Date(me.createdAt))
        : null,
    ],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <>
      {welcome && (
        <p className="mb-6 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
          Welcome to Tahrio, {me.name.split(' ')[0]}! Your account is ready.
        </p>
      )}
      <div className="mb-6 flex items-center gap-4">
        <span className="bg-gradient-button flex size-14 items-center justify-center rounded-full text-2xl font-bold text-white">
          {me.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-bold">My Account</h1>
          <p className="text-sm text-muted">Hi, {me.name}</p>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-card bg-bg p-5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/track-order" className="bg-gradient-button rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          Track your order
        </Link>
        <Link href="/wishlist" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
          My wishlist
        </Link>
        <form action={logoutAction} className="ml-auto">
          <button type="submit" className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10">
            <LogOut aria-hidden className="size-4" /> Logout
          </button>
        </form>
      </div>
    </>
  );
}
