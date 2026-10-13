'use client';

import { useStore } from './store-provider';

export function CartBadge() {
  const { cart } = useStore();
  const count = cart.reduce((n, l) => n + l.qty, 0);
  if (!count) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-primary px-1 text-[10px] font-semibold text-white">
      {count > 99 ? '99+' : count}
      <span className="sr-only"> items in cart</span>
    </span>
  );
}
