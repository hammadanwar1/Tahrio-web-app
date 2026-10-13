// Server-side catalog access. One cached snapshot of the whole catalog (it's small), refreshed
// hourly and on demand via revalidateTag('catalog') — see src/app/api/revalidate/route.ts.
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

import seed from '@/data/seed.json';
import type { Banner, Category, Product, Review } from './types';
import { categoriesWithCounts, type Catalog } from './catalog-core';

/** Tahrio API base, e.g. https://api.tahrio.pk/api. Empty → use the bundled seed snapshot. */
const API = (process.env.TAHRIO_API_URL ?? '').replace(/\/$/, '');

export interface CatalogSnapshot extends Catalog {
  banners: Banner[];
  reviews: Review[];
  trending: string[];
  /** ISO time the snapshot was taken (sitemap lastModified). */
  fetchedAt: string;
  /** ISO date one year after fetchedAt (Offer.priceValidUntil). */
  priceValidUntil: string;
  source: 'api' | 'seed';
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function fromApi() {
  const [categories, page, banners, trending] = await Promise.all([
    fetchJson<Category[]>('/categories'),
    fetchJson<{ items: Product[] }>('/products'),
    Promise.all([fetchJson<Banner[]>('/banners?placement=home'), fetchJson<Banner[]>('/banners?placement=categories')]),
    fetchJson<string[]>('/search/trending'),
  ]);
  const reviews = (
    await Promise.all(page.items.map((p) => fetchJson<Review[]>(`/products/${p.id}/reviews`).catch(() => [] as Review[])))
  ).flat();
  return { categories, products: page.items, banners: banners.flat(), trending, reviews, source: 'api' as const };
}

function fromSeed() {
  const s = seed as unknown as {
    categories: Category[];
    products: Product[];
    banners: Banner[];
    reviews?: Review[];
    trending: string[];
  };
  return { categories: s.categories, products: s.products, banners: s.banners, trending: s.trending, reviews: s.reviews ?? [], source: 'seed' as const };
}

export async function getCatalog(): Promise<CatalogSnapshot> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalog');

  let data: ReturnType<typeof fromSeed> | Awaited<ReturnType<typeof fromApi>>;
  if (API) {
    try {
      data = await fromApi();
    } catch (err) {
      console.warn('[catalog] API unavailable, serving bundled seed:', (err as Error).message);
      data = fromSeed();
    }
  } else {
    data = fromSeed();
  }

  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setFullYear(now.getFullYear() + 1);
  const catalog: Catalog = { categories: data.categories, products: data.products };
  return {
    ...data,
    categories: categoriesWithCounts(catalog),
    reviews: [...data.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    fetchedAt: now.toISOString(),
    priceValidUntil: validUntil.toISOString().slice(0, 10),
  };
}
