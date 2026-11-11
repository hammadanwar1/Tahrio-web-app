import { site } from '@/lib/site';
import type { Product } from '@/lib/types';

/**
 * Open Graph product tags (Facebook / WhatsApp catalogs, Pinterest): price, stock and brand in link
 * previews. Next's metadata API only renders <meta name>, and these need <meta property>, so they
 * are rendered here; React hoists <meta> into <head>.
 */
export function ProductMeta({ product: p }: { product: Product }) {
  return (
    <>
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={String(p.price)} />
      <meta property="product:price:currency" content={site.currency} />
      <meta property="product:availability" content={p.inStock ? 'in stock' : 'out of stock'} />
      <meta property="product:condition" content="new" />
      <meta property="product:brand" content={site.name} />
      <meta property="product:retailer_item_id" content={p.id} />
    </>
  );
}
