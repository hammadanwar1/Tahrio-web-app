import Link from 'next/link';

import { categoryPath } from '@/lib/catalog-core';
import type { Category } from '@/lib/types';
import { ProductGlyph } from './product-glyph';

/** Row of category icons above product listings (current category highlighted). */
export function CategoryStrip({ categories, activeId }: { categories: Category[]; activeId?: string }) {
  return (
    <nav aria-label="Categories" className="border-b border-line">
      <ul className="scrollbar-none flex gap-2 overflow-x-auto pb-4 sm:gap-4">
        {categories.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={categoryPath(c)}
                aria-current={active ? 'page' : undefined}
                className="group flex w-24 flex-col items-center gap-2 rounded-card px-1 py-2 text-center"
              >
                <span
                  className={`flex size-16 items-center justify-center rounded-2xl transition-colors ${
                    active ? 'bg-gradient-button text-white' : 'bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white'
                  }`}
                >
                  <ProductGlyph kind={c.icon} className="size-8" />
                </span>
                <span className={`text-[13px] leading-tight ${active ? 'font-semibold text-primary' : ''}`}>{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
