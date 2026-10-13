import { productImage, productSlug } from './catalog-core';
import type { Product } from './types';

/** Minimal current product data handed to client components (prices are never taken from localStorage). */
export interface LiveProduct {
  id: string;
  slug: string;
  name: string;
  label: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  image: string | null;
  icon: string;
}

export const toLiveProducts = (products: Product[]): Record<string, LiveProduct> =>
  Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        id: p.id,
        slug: productSlug(p),
        name: p.name,
        label: p.label,
        price: p.price,
        oldPrice: p.oldPrice,
        inStock: p.inStock,
        image: productImage(p),
        icon: p.icon,
      },
    ]),
  );
