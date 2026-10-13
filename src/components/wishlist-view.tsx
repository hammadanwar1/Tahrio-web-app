'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

import type { Product } from '@/lib/types';
import { useStore } from './store-provider';
import { ProductGrid } from './product-card';

export function WishlistView({ products }: { products: Product[] }) {
  const { wishlist } = useStore();
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = wishlist.map((id) => byId.get(id)).filter((p) => p !== undefined);
  if (!items.length) {
    return (
      <div className="flex flex-col items-center rounded-card border border-line bg-surface px-6 py-16 text-center">
        <span className="mb-5 flex size-24 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Heart aria-hidden className="size-10" />
        </span>
        <h2 className="text-[22px] font-bold">Your wishlist is empty</h2>
        <p className="mt-2 text-muted">Tap ♥ on any product to save it here.</p>
        <Link href="/" className="bg-gradient-button mt-8 rounded-button px-10 py-4 font-semibold text-white">
          Explore products
        </Link>
      </div>
    );
  }
  return <ProductGrid products={items} />;
}
