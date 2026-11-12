import { getCatalog } from '@/lib/catalog';
import { findProductBySlug, productImage, productSlug, withDiscount } from '@/lib/catalog-core';
import { rs } from '@/lib/format';
import { OgLockup, OgPill, ogBackground, ogJpeg, ogPhoto, ogSize } from '@/lib/og';

export const alt = 'Tahrio product';
export const size = ogSize;
export const contentType = 'image/jpeg';

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ slug: productSlug(p) }));
}

/** Social share card: photo + name + price. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const found = findProductBySlug(catalog, slug);
  const p = found ? withDiscount(found) : null;
  const photo = p ? await ogPhoto(productImage(p)) : null;

  return ogJpeg(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: ogBackground,
        color: 'white',
        fontFamily: 'Outfit',
        padding: 56,
        gap: 52,
        alignItems: 'center',
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          width={500}
          height={500}
          style={{ borderRadius: 40, objectFit: 'cover', border: '5px solid rgba(255,255,255,.18)' }}
          alt=""
        />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 24 }}>
        <OgLockup size={56} />
        <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.1 }}>{p?.fullName ?? 'Mobile accessories'}</div>
        {p && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ fontSize: 52, fontWeight: 700 }}>{rs(p.price)}</div>
            {p.oldPrice && p.discount ? (
              <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.6, textDecoration: 'line-through' }}>
                {rs(p.oldPrice)}
              </div>
            ) : null}
            {p.discount ? (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  background: '#D946EF',
                  padding: '6px 16px',
                  borderRadius: 40,
                }}
              >
                {`-${p.discount}%`}
              </div>
            ) : null}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <OgPill>Cash on delivery</OgPill>
          {p && !p.inStock ? <OgPill>Out of stock</OgPill> : <OgPill>In stock</OgPill>}
        </div>
      </div>
    </div>,
  );
}
