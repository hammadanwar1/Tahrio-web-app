'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Menu, PackageSearch, X } from 'lucide-react';

import { BrandTile, type BrandTileData } from './brand-tile';
import { ProductGlyph } from './product-glyph';
import { SocialIcon, socialLinks } from './social-icons';

export interface NavData {
  categories: { name: string; href: string; icon: string }[];
  brands: BrandTileData[];
  families: {
    id: string;
    name: string;
    href: string;
    series: { name: string; models: { name: string; href: string }[] }[];
  }[];
}

type OpenMenu = 'category' | 'brand' | 'model' | null;

const links = [
  { href: '/sale', label: 'On Sale' },
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About Us' },
];

/**
 * Dark navigation bar (sticky). Desktop: category + brand dropdowns open on hover, the model
 * mega menu on click. Mobile: a drawer with the same sections.
 */
export function MainNav({ nav }: { nav: NavData }) {
  const [open, setOpen] = useState<OpenMenu>(null);
  const [family, setFamily] = useState(nav.families[0]?.id);
  const [drawer, setDrawer] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(null);
        setDrawer(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (bar.current && !bar.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, drawer]);

  // Following any link inside a menu closes it.
  const closeOnLink = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) {
      setOpen(null);
      setDrawer(false);
    }
  };
  const hover = (menu: OpenMenu) => ({
    onMouseEnter: () => setOpen(menu),
    onMouseLeave: () => setOpen((m) => (m === menu ? null : m)),
  });
  const activeFamily = nav.families.find((f) => f.id === family) ?? nav.families[0];

  return (
    <div ref={bar} onClick={closeOnLink} className="sticky top-0 z-40 bg-ink text-white shadow-nav">
      {/* ---------- desktop ---------- */}
      <nav aria-label="Main" className="container-page relative hidden h-14 items-stretch lg:flex">
        <div {...hover('category')} className="relative">
          <button
            type="button"
            aria-expanded={open === 'category'}
            onClick={() => setOpen(open === 'category' ? null : 'category')}
            className="bg-gradient-button flex h-full items-center gap-2.5 px-5 text-[15px] font-semibold"
          >
            <Menu aria-hidden className="size-5" />
            Shop by Category
          </button>
          {open === 'category' && (
            <Panel className="left-0 w-72 py-2">
              <ul>
                {nav.categories.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className="flex items-center gap-3 px-5 py-2.5 hover:bg-primary-soft hover:text-primary">
                      <ProductGlyph kind={c.icon} className="size-5 text-primary" />
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-line pt-1">
                  <Link href="/collections" className="flex items-center justify-between px-5 py-2.5 font-semibold text-primary">
                    All categories <ChevronRight aria-hidden className="size-4" />
                  </Link>
                </li>
              </ul>
            </Panel>
          )}
        </div>

        <div {...hover('brand')} className="flex">
          <TopButton active={open === 'brand'} onClick={() => setOpen(open === 'brand' ? null : 'brand')}>
            Shop by Brand
          </TopButton>
          {open === 'brand' && (
            <Panel className="inset-x-4 sm:inset-x-6">
              <ul className="grid max-h-[70vh] grid-cols-6 overflow-y-auto">
                {nav.brands.map((b) => (
                  <li key={b.href} className="border-b border-r border-line">
                    <BrandTile brand={b} />
                  </li>
                ))}
              </ul>
              <Link href="/brands" className="flex items-center justify-center gap-1 py-3 text-sm font-semibold text-primary hover:bg-primary-soft">
                View all brands <ChevronRight aria-hidden className="size-4" />
              </Link>
            </Panel>
          )}
        </div>

        <div className="flex">
          <TopButton active={open === 'model'} onClick={() => setOpen(open === 'model' ? null : 'model')}>
            Shop by Model
          </TopButton>
          {open === 'model' && activeFamily && (
            <Panel className="inset-x-4 grid grid-cols-[240px_1fr] sm:inset-x-6">
              <ul className="border-r border-line py-2">
                {nav.families.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setFamily(f.id)}
                      onFocus={() => setFamily(f.id)}
                      onClick={() => setFamily(f.id)}
                      aria-pressed={f.id === activeFamily.id}
                      className={`flex w-full items-center justify-between px-5 py-3 text-left ${
                        f.id === activeFamily.id ? 'bg-primary-soft font-semibold text-primary' : 'hover:bg-bg'
                      }`}
                    >
                      {f.name}
                      <ChevronRight aria-hidden className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="max-h-[70vh] overflow-y-auto p-6">
                <Link href={activeFamily.href} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  All {activeFamily.name} accessories <ChevronRight aria-hidden className="size-4" />
                </Link>
                <div className="columns-3 gap-8">
                  {activeFamily.series.map((s) => (
                    <div key={s.name} className="mb-5 break-inside-avoid">
                      <p className="mb-1.5 font-semibold">{s.name}</p>
                      <ul className="space-y-1.5 text-sm text-muted">
                        {s.models.map((m) => (
                          <li key={m.href}>
                            <Link href={m.href} className="hover:text-primary">
                              {m.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          )}
        </div>

        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex items-center px-4 text-[15px] font-medium hover:text-[#22d3ee]">
            {l.label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-3">
          {socialLinks.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener" aria-label={s.label} className="hover:text-[#22d3ee]">
              <SocialIcon name={s.name} />
            </a>
          ))}
          <span aria-hidden className="mx-2 h-7 w-px bg-white/30" />
          <Link href="/track-order" className="flex items-center gap-2 text-[15px] font-medium hover:text-[#22d3ee]">
            <PackageSearch aria-hidden className="size-5" />
            Track Your Order
          </Link>
        </div>
      </nav>

      {/* ---------- mobile ---------- */}
      <div className="container-page flex h-12 items-center gap-4 text-sm font-medium lg:hidden">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
          className="bg-gradient-button -ml-4 flex h-full items-center gap-2 px-4 font-semibold sm:-ml-6 sm:px-6"
        >
          <Menu aria-hidden className="size-5" /> Menu
        </button>
        <div className="scrollbar-none flex gap-4 overflow-x-auto">
          {links.slice(0, 3).map((l) => (
            <Link key={l.href} href={l.href} className="shrink-0">
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/60" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-surface text-ink">
            <div className="bg-gradient-hero flex items-center justify-between px-5 py-4 text-white">
              <span className="text-lg font-bold">Menu</span>
              <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)}>
                <X aria-hidden className="size-6" />
              </button>
            </div>
            <DrawerSection title="Shop by Category">
              {nav.categories.map((c) => (
                <DrawerLink key={c.href} href={c.href}>
                  <ProductGlyph kind={c.icon} className="size-4 text-primary" /> {c.name}
                </DrawerLink>
              ))}
            </DrawerSection>
            <DrawerSection title="Shop by Brand">
              {nav.brands.map((b) => (
                <DrawerLink key={b.href} href={b.href}>
                  {b.name}
                </DrawerLink>
              ))}
            </DrawerSection>
            <DrawerSection title="Shop by Model">
              {nav.families.map((f) => (
                <details key={f.id} className="group/f">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-2 pl-3 font-medium">
                    {f.name}
                    <ChevronDown aria-hidden className="size-4 transition-transform group-open/f:rotate-180" />
                  </summary>
                  <div className="pb-2 pl-6">
                    <DrawerLink href={f.href}>All {f.name}</DrawerLink>
                    {f.series.flatMap((s) => s.models).map((m) => (
                      <DrawerLink key={m.href} href={m.href}>
                        {m.name}
                      </DrawerLink>
                    ))}
                  </div>
                </details>
              ))}
            </DrawerSection>
            <nav aria-label="Pages" className="border-b border-line px-5 py-2">
              {[...links, { href: '/track-order', label: 'Track Your Order' }, { href: '/contact', label: 'Contact Us' }].map((l) => (
                <DrawerLink key={l.href} href={l.href}>
                  {l.label}
                </DrawerLink>
              ))}
            </nav>
            <div className="flex gap-5 px-5 py-5 text-primary">
              {socialLinks.map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener" aria-label={s.label}>
                  <SocialIcon name={s.name} className="size-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-expanded={active}
      onClick={onClick}
      className={`flex items-center gap-1 px-4 text-[15px] font-medium transition-colors ${active ? 'text-[#22d3ee]' : 'hover:text-[#22d3ee]'}`}
    >
      {children}
      <ChevronDown aria-hidden className={`size-4 transition-transform ${active ? 'rotate-180' : ''}`} />
    </button>
  );
}

function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`absolute top-full z-50 overflow-hidden rounded-b-card bg-surface text-ink shadow-nav ${className}`}>
      {children}
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-line px-5">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold">
        {title}
        <ChevronDown aria-hidden className="size-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}

function DrawerLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 py-2 pl-3 text-[15px] text-ink/80 hover:text-primary">
      {children}
    </Link>
  );
}
