import { getCatalog } from '@/lib/catalog';
import { categorySlug, filterProducts, findCategoryBySlug, productImage } from '@/lib/catalog-core';
import { rs } from '@/lib/format';
import { OgLockup, OgPill, ogBackground, ogJpeg, ogPhoto, ogSize } from '@/lib/og';

export const alt = 'Tahrio category';
export const size = ogSize;
export const contentType = 'image/jpeg';

export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.map((c) => ({ slug: categorySlug(c) }));
}

/** Share card for a category: name, "from" price and up to three product photos. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const category = findCategoryBySlug(catalog, slug);
  const products = category ? filterProducts(catalog, { categoryId: category.id }) : [];
  const photos = (await Promise.all(products.slice(0, 3).map((p) => ogPhoto(productImage(p))))).filter(
    Boolean,
  ) as string[];
  const from = products.length ? Math.min(...products.map((p) => p.price)) : null;

  return ogJpeg(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 64px',
        gap: 30,
        color: 'white',
        fontFamily: 'Outfit',
        background: ogBackground,
      }}
    >
      <OgLockup size={60} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 18 }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.05 }}>
            {`${category?.name ?? 'Mobile accessories'} in Pakistan`}
          </div>
          {from !== null && (
            <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.9 }}>{`${products.length} products · from ${rs(from)}`}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              width={190}
              height={190}
              alt=""
              style={{ borderRadius: 30, objectFit: 'cover', border: '4px solid rgba(255,255,255,.18)' }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <OgPill>Cash on delivery</OgPill>
        <OgPill>Original products</OgPill>
      </div>
    </div>,
  );
}
