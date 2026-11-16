// Pure catalog logic (no I/O). Mirrors backend/src/logic.js queryProducts so web search,
// collection filters and the mobile app all return the same results.
import { discountPercent, slugify } from './format';
import { site } from './site';
import type { Brand, Category, Product, ProductFilter } from './types';

export interface Catalog {
  categories: Category[];
  products: Product[];
  brands?: Brand[];
}

/** SEO slug for a product: from its name, e.g. /products/tahrio-pods-pro-anc */
export const productSlug = (p: Pick<Product, 'name'>) => slugify(p.name);

/** SEO slug for a category: from its full name, e.g. /collections/phone-cases */
export const categorySlug = (c: Pick<Category, 'name'>) => slugify(c.name);

export const productPath = (p: Pick<Product, 'name'>) => `/products/${productSlug(p)}`;
export const categoryPath = (c: Pick<Category, 'name'>) => `/collections/${categorySlug(c)}`;

/** Public image path for a product photo (API stores mobile-app asset paths). */
export function productImage(p: Pick<Product, 'id' | 'imageUrl'>): string | null {
  if (!p.imageUrl) return null;
  if (/^https?:\/\//.test(p.imageUrl)) return p.imageUrl;
  const file = p.imageUrl.split('/').pop();
  return file ? `/products/${file}` : null;
}

/** All photos of a product (main photo first), as public paths. */
export function galleryImages(p: Pick<Product, 'id' | 'imageUrl' | 'images'>): string[] {
  const all = [p.imageUrl, ...(p.images ?? [])].map((imageUrl) => productImage({ id: p.id, imageUrl: imageUrl ?? null }));
  return [...new Set(all.filter((src): src is string => Boolean(src)))];
}

export const withDiscount =(p: Product): Product => ({ ...p, discount: discountPercent(p.price, p.oldPrice) });

const norm = (s: unknown) => String(s ?? '').toLowerCase().trim();

function matchesQuery(p: Product, category: Category | undefined, q: string) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [p.name, p.fullName, p.label, category?.name, ...p.tags].map(norm).join(' ');
  return words.every((w) => hay.includes(w) || (w.endsWith('s') && hay.includes(w.slice(0, -1))));
}

export function filterProducts(catalog: Catalog, f: ProductFilter = {}): Product[] {
  const catById = new Map(catalog.categories.map((c) => [c.id, c]));
  const list = catalog.products.filter((p) => {
    if (f.categoryId && p.categoryId !== f.categoryId) return false;
    if (f.tag && f.tag !== 'All' && !p.tags.includes(f.tag)) return false;
    if (f.section === 'hot' && !p.hot) return false;
    if (f.section === 'new' && !p.isNew) return false;
    if (f.minPrice != null && p.price < f.minPrice) return false;
    if (f.maxPrice != null && p.price > f.maxPrice) return false;
    if (f.minRating != null && p.rating < f.minRating) return false;
    if (f.onSale && !discountPercent(p.price, p.oldPrice)) return false;
    if (f.inStock && !p.inStock) return false;
    if (f.q && !matchesQuery(p, catById.get(p.categoryId), f.q)) return false;
    return true;
  });
  const sorters: Record<string, (a: Product, b: Product) => number> = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity,
    popular: (a, b) => b.popularity - a.popularity,
  };
  return list.sort(sorters[f.sort ?? 'popular'] ?? sorters.popular).map(withDiscount);
}

export function categoriesWithCounts(catalog: Catalog): Category[] {
  return catalog.categories.map((c) => ({
    ...c,
    itemCount: catalog.products.filter((p) => p.categoryId === c.id).length,
  }));
}

export const findProductBySlug = (catalog: Catalog, slug: string) =>
  catalog.products.find((p) => productSlug(p) === slug);

export const findCategoryBySlug = (catalog: Catalog, slug: string) =>
  catalog.categories.find((c) => categorySlug(c) === slug);

// ---------- brands & device models ----------

export const brandOf = (p: Pick<Product, 'brand'>) => p.brand?.trim() || site.name;
export const brandPath = (name: string) => `/brands/${slugify(name)}`;

/**
 * "Shop by Brand": the brands managed in the admin panel (in their order), then any other brand
 * typed on a product. Matched by slug, so "anker" and "Anker" are the same brand.
 */
export function listBrands(catalog: Catalog) {
  const list = new Map(
    (catalog.brands ?? []).map((b) => [
      slugify(b.name),
      { name: b.name, slug: slugify(b.name), color: b.color || '#0f1433', logoUrl: b.logoUrl ?? null, count: 0 },
    ]),
  );
  for (const p of catalog.products) {
    const slug = slugify(brandOf(p));
    const entry = list.get(slug) ?? { name: brandOf(p), slug, color: '#0f1433', logoUrl: null, count: 0 };
    entry.count++;
    list.set(slug, entry);
  }
  return [...list.values()];
}

export const productsForBrand = (catalog: Catalog, slug: string) =>
  catalog.products.filter((p) => slugify(brandOf(p)) === slug).map(withDiscount);

// "+" matters in model names: Galaxy S26 and Galaxy S26+ need different URLs.
export const modelSlug = (model: string) => slugify(model.replace(/\+/g, ' plus'));
export const modelPath = (model: string) => `/models/${modelSlug(model)}`;

/** Products listing any of these models as compatible. */
export const productsForModels = (catalog: Catalog, models: string[]) =>
  catalog.products.filter((p) => p.models?.some((m) => models.includes(m))).map(withDiscount);

/** Same-category products first, then same tags; excludes the product itself. */
export function relatedProducts(catalog: Catalog, product: Product, limit = 4): Product[] {
  const score = (p: Product) =>
    (p.categoryId === product.categoryId ? 10 : 0) + p.tags.filter((t) => product.tags.includes(t)).length;
  return catalog.products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => score(b) - score(a) || b.popularity - a.popularity)
    .slice(0, limit)
    .map(withDiscount);
}
