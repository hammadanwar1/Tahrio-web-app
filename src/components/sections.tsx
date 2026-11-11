import Link from 'next/link';
import { BadgeCheck, Banknote, RotateCcw, Truck } from 'lucide-react';

import { categoryPath } from '@/lib/catalog-core';
import type { Banner, Category } from '@/lib/types';
import { site } from '@/lib/site';
import { ProductGlyph } from './product-glyph';

export function SectionHeader({ title, href, linkLabel = 'View all', as: As = 'h2' }: {
  title: string;
  href?: string;
  linkLabel?: string;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <As className="text-[22px] font-bold sm:text-2xl">{title}</As>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-medium text-primary hover:underline">
          {linkLabel}
          <span className="sr-only"> – {title}</span>
        </Link>
      )}
    </div>
  );
}

/** Hero promo (Figma "MEGA SALE" banner): gradient/hero, white circle with glyph. */
export function PromoBanner({ banner, category, headingLevel = 'h2' }: {
  banner: Banner;
  category?: Category;
  headingLevel?: 'h1' | 'h2';
}) {
  const H = headingLevel;
  return (
    <section className="bg-gradient-hero relative overflow-hidden rounded-card p-6 text-white sm:p-10">
      <span aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
      <div className="relative flex items-center justify-between gap-6">
        <div className="max-w-md space-y-3">
          <p className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wider">{banner.tag}</p>
          <H className="text-[28px] font-bold leading-tight sm:text-4xl">{banner.title}</H>
          <p className="text-sm text-white/85 sm:text-base">{banner.subtitle}</p>
          {category && (
            <Link
              href={categoryPath(category)}
              className="mt-2 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary"
            >
              {banner.cta}
              <span className="sr-only"> – {category.name}</span>
            </Link>
          )}
        </div>
        <div aria-hidden className="flex size-28 shrink-0 items-center justify-center rounded-full bg-white text-primary sm:size-44">
          <ProductGlyph kind={banner.icon} className="size-14 sm:size-20" />
        </div>
      </div>
    </section>
  );
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 sm:grid sm:grid-cols-5 sm:overflow-visible lg:grid-cols-10">
      {categories.map((c) => (
        <li key={c.id} className="shrink-0">
          <Link href={categoryPath(c)} className="group flex w-[72px] flex-col items-center gap-2 sm:w-auto">
            <span className="flex size-[66px] items-center justify-center rounded-[22px] border border-line bg-surface text-primary transition-colors group-hover:border-primary">
              <ProductGlyph kind={c.icon} className="size-[30px]" />
            </span>
            <span className="text-center text-xs font-medium">{c.shortName}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TrustBar() {
  const items = [
    { icon: Banknote, title: 'Cash on delivery', text: 'Pay when it arrives, anywhere in Pakistan' },
    { icon: Truck, title: 'Nationwide delivery', text: `${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} days nationwide` },
    { icon: RotateCcw, title: `${site.policy.returnDays}-day returns`, text: 'Free, no-hassle exchanges' },
    { icon: BadgeCheck, title: '100% original', text: 'Quality-checked before dispatch' },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon aria-hidden className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block text-xs text-muted">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-surface">
      {faqs.map((f) => (
        <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            <h3 className="text-base">{f.q}</h3>
            <span aria-hidden className="text-xl text-primary transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
