'use client';
// Orders placed from this browser (guest checkout): kept locally so the customer can track them.

import type { PlacedOrder } from './actions';

const KEY = 'tahrio-orders-v1';

export function savedOrders(): PlacedOrder[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as PlacedOrder[];
  } catch {
    return [];
  }
}

export function saveOrder(order: PlacedOrder) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([order, ...savedOrders().filter((o) => o.id !== order.id)].slice(0, 20)));
  } catch {
    // ignore
  }
}
