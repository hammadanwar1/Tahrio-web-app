// Shapes returned by the Tahrio REST API (../tahrio/backend). Kept in sync with backend/data/seed.json.

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  /** "-20%", "NEW" or null */
  badge: string | null;
  itemCount?: number;
  filters?: string[];
}

/** "Shop by Brand" entry, managed in the admin panel (logo uploaded there). */
export interface Brand {
  id: string;
  name: string;
  color?: string | null;
  logoUrl?: string | null;
}

export interface Product {
  id: string;
  name: string;
  fullName: string;
  categoryId: string;
  label: string;
  tags: string[];
  icon: string;
  /** Relative to the mobile app assets (assets/products/x.jpg) or an absolute URL. */
  imageUrl: string | null;
  videoUrl?: string | null;
  price: number;
  oldPrice: number | null;
  rating: number;
  /** Review count. */
  reviews: number;
  sold: number;
  freeDelivery: boolean;
  inStock: boolean;
  hot: boolean;
  isNew: boolean;
  popularity: number;
  colors: ColorOption[];
  description: string;
  variantLabel?: string;
  discount?: number;
  /** Empty → sold as the store's own brand. */
  brand?: string;
  /** Phone / device models it fits (data/devices.ts names), for "Shop by Model". */
  models?: string[];
  /** Extra photos (first one is imageUrl). */
  images?: string[];
  highlights?: string[];
  specs?: { key: string; value: string }[];
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  text: string;
  verified: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  placement: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: string;
  categoryId?: string;
}

export type SortKey = 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

export interface ProductFilter {
  categoryId?: string;
  q?: string;
  tag?: string;
  section?: 'hot' | 'new';
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSale?: boolean;
  inStock?: boolean;
  sort?: SortKey;
}
