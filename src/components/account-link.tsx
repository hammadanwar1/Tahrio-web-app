'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { UserRound } from 'lucide-react';

import { readProfileCookie } from '@/lib/account-cookies';

// document.cookie has no change event. Sign-in / sign-out navigate, and the pathname change
// re-renders this component, which re-reads the cookie.
const subscribe = () => () => {};
const getName = () => readProfileCookie(document.cookie)?.name ?? null;

/** "Login / Register", or "Hi, Ali" once signed in. */
export function AccountLink() {
  usePathname();
  const name = useSyncExternalStore(subscribe, getName, () => null);
  return (
    <Link href={name ? '/account' : '/login'} className="flex items-center gap-2 text-sm font-medium">
      <span className="flex size-11 items-center justify-center rounded-full border border-line">
        <UserRound aria-hidden className="size-5" />
      </span>
      <span className="hidden md:inline">{name ? `Hi, ${name.split(' ')[0]}` : 'Login / Register'}</span>
      <span className="sr-only md:hidden">{name ? 'My account' : 'Login or register'}</span>
    </Link>
  );
}
