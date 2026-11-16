import Link from 'next/link';
import { Heart, Search, ShoppingCart } from 'lucide-react';

import { deviceFamilies } from '@/data/devices';
import { getCatalog } from '@/lib/catalog';
import { brandPath, categoryPath, listBrands, modelPath } from '@/lib/catalog-core';
import { rs } from '@/lib/format';
import { site } from '@/lib/site';
import { AccountLink } from './account-link';
import { CartBadge } from './cart-badge';
import { Logo } from './logo';
import { MainNav, type NavData } from './main-nav';

const announcements = [
  'Cash on delivery all over Pakistan',
  `Delivery ${rs(site.policy.standardDeliveryFee)} · ${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} days`,
  `${site.policy.returnDays}-day easy returns`,
  '100% original products',
  `Order on WhatsApp: ${site.phone.replace('+92-', '0')}`,
];

const topLinks = [
  { href: '/return-policy', label: 'Return Policy' },
  { href: '/shipping-policy', label: 'Delivery Information' },
  { href: '/contact', label: 'How To Reach' },
];

export async function SiteHeader() {
  const catalog = await getCatalog();
  const nav: NavData = {
    categories: catalog.categories.map((c) => ({ name: c.name, href: categoryPath(c), icon: c.icon })),
    brands: listBrands(catalog).map((b) => ({ name: b.name, href: brandPath(b.name), color: b.color, logoUrl: b.logoUrl, count: b.count })),
    families: deviceFamilies.map((f) => ({
      id: f.id,
      name: f.name,
      href: modelPath(f.id),
      series: f.series.map((s) => ({ name: s.name, models: s.models.map((m) => ({ name: m, href: modelPath(m) })) })),
    })),
  };

  return (
    <>
      {/* Announcement bar: scrolling offers + policy links. */}
      <div className="bg-gradient-hero text-white">
        <div className="container-page flex h-10 items-center gap-6 text-[13px] font-medium">
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
            <p className="animate-marquee flex w-max whitespace-nowrap">
              {[...announcements, ...announcements].map((a, i) => (
                <span key={i} aria-hidden={i >= announcements.length} className="flex items-center gap-10 pr-10">
                  {a}
                  <span aria-hidden className="text-white/50">
                    ✦
                  </span>
                </span>
              ))}
            </p>
          </div>
          <nav aria-label="Store policies" className="hidden shrink-0 items-center gap-3 lg:flex">
            {topLinks.map((l, i) => (
              <span key={l.href} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden className="text-white/40">|</span>}
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <header className="border-b border-line bg-surface">
        <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-3 py-3 lg:flex-nowrap lg:gap-8 lg:py-4">
          <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
            <Logo size={44} />
          </Link>

          <form action="/search" role="search" className="order-last flex w-full lg:order-none lg:flex-1">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <div className="flex h-12 w-full items-center rounded-full border border-line bg-bg pl-5 pr-1.5 focus-within:border-primary">
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Find your favourite items…"
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="bg-gradient-button flex h-9 w-14 items-center justify-center rounded-full text-white"
              >
                <Search aria-hidden className="size-5" />
              </button>
            </div>
          </form>

          <nav aria-label="Account" className="ml-auto flex items-center gap-2 sm:gap-3">
            <AccountLink />
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden size-11 items-center justify-center rounded-full border border-line sm:flex"
            >
              <Heart aria-hidden className="size-5" />
            </Link>
            <Link
              href="/cart"
              className="bg-gradient-button relative flex h-11 items-center gap-2 rounded-full pl-1.5 pr-4 text-sm font-semibold text-white"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-white/25">
                <ShoppingCart aria-hidden className="size-[18px]" />
              </span>
              Cart
              <CartBadge />
            </Link>
          </nav>
        </div>
      </header>

      <MainNav nav={nav} />
    </>
  );
}
