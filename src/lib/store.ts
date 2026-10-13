'use client';
// Cart + wishlist persisted in localStorage, exposed through useSyncExternalStore.

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  icon: string;
  variant: string | null;
  qty: number;
}

export interface StoreState {
  cart: CartLine[];
  wishlist: string[];
  promoCode: string | null;
}

const KEY = 'tahrio-store-v1';
const empty: StoreState = { cart: [], wishlist: [], promoCode: null };

let state: StoreState = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...(JSON.parse(raw) as StoreState) };
  } catch {
    state = empty;
  }
}

function set(next: StoreState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage full: keep the in-memory state.
  }
  listeners.forEach((l) => l());
}

export const store = {
  subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        loaded = false;
        load();
        listener();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },
  get: () => {
    load();
    return state;
  },
  getServer: () => empty,

  addToCart(line: Omit<CartLine, 'qty'>, qty = 1) {
    const existing = state.cart.find((l) => l.productId === line.productId && l.variant === line.variant);
    const cart = existing
      ? state.cart.map((l) => (l === existing ? { ...l, qty: Math.min(10, l.qty + qty) } : l))
      : [...state.cart, { ...line, qty }];
    set({ ...state, cart });
  },
  setQty(productId: string, variant: string | null, qty: number) {
    const cart = state.cart
      .map((l) => (l.productId === productId && l.variant === variant ? { ...l, qty: Math.min(10, qty) } : l))
      .filter((l) => l.qty > 0);
    set({ ...state, cart });
  },
  clearCart() {
    set({ ...state, cart: [], promoCode: null });
  },
  setPromo(code: string | null) {
    set({ ...state, promoCode: code });
  },
  /** Returns true when the product is now wishlisted. */
  toggleWishlist(productId: string) {
    const has = state.wishlist.includes(productId);
    set({ ...state, wishlist: has ? state.wishlist.filter((id) => id !== productId) : [productId, ...state.wishlist] });
    return !has;
  },
};
