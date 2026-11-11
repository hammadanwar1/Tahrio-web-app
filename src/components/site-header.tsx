import Link from 'next/link';
import { Heart, Search, ShoppingBag, Truck } from 'lucide-react';

import { getCatalog } from '@/lib/catalog';
import { categoryPath } from '@/lib/catalog-core';
import { site } from '@/lib/site';
import { CartBadge } from './cart-badge';
import { Logo } from './logo';

export async function SiteHeader() {
  const { categories } = await getCatalog();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <p className="bg-ink py-2 text-center text-xs text-white/90">
        <Truck aria-hidden className="mr-1.5 inline size-3.5 align-[-2px]" />
        Delivery across Pakistan · Cash on delivery · {site.policy.returnDays}-day easy returns
      </p>
      <div className="container-page flex items-center gap-3 py-3 sm:gap-6">
        <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
          <Logo />
        </Link>
        <form action="/search" role="search" className="relative flex-1">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search cases, chargers, earbuds…"
            className="h-12 w-full rounded-input border border-line bg-surface pl-12 pr-4 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </form>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden size-11 items-center justify-center rounded-full border border-line bg-surface sm:flex"
          >
            <Heart aria-hidden className="size-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex size-11 items-center justify-center rounded-full border border-line bg-surface"
          >
            <ShoppingBag aria-hidden className="size-5" />
            <CartBadge />
          </Link>
        </nav>
      </div>
      <nav aria-label="Categories" className="container-page scrollbar-none flex gap-1 overflow-x-auto pb-2">
        <Link href="/collections" className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-primary-soft">
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={categoryPath(c)}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-primary-soft hover:text-ink"
          >
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
