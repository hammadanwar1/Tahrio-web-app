import { getCatalog } from '@/lib/catalog';
import { productImage } from '@/lib/catalog-core';
import { OgLockup, OgPill, ogBackground, ogJpeg, ogPhoto, ogSize } from '@/lib/og';

export const alt = 'Tahrio – original mobile accessories in Pakistan';
export const size = ogSize;
export const contentType = 'image/jpeg';

/** Default share card for the site (pages without their own opengraph-image inherit it). */
export default async function Image() {
  const { products } = await getCatalog();
  const picks = [...products]
    .filter((p) => productImage(p))
    .sort((a, b) => Number(!!b.hot) - Number(!!a.hot))
    .slice(0, 4);
  const photos = (await Promise.all(picks.map((p) => ogPhoto(productImage(p))))).filter(Boolean) as string[];

  return ogJpeg(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 64px',
        gap: 48,
        color: 'white',
        fontFamily: 'Outfit',
        background: ogBackground,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 28 }}>
        <OgLockup size={76} />
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05 }}>Original mobile accessories in Pakistan</div>
        <div style={{ fontSize: 28, fontWeight: 500, opacity: 0.85 }}>Earbuds · Chargers · Cases · Power banks · Smart watches</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <OgPill>Cash on delivery</OgPill>
          <OgPill>Nationwide delivery</OgPill>
        </div>
      </div>
      {photos.length >= 4 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 452, gap: 20 }}>
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              width={216}
              height={216}
              alt=""
              style={{ borderRadius: 32, objectFit: 'cover', border: '4px solid rgba(255,255,255,.18)' }}
            />
          ))}
        </div>
      )}
    </div>,
  );
}
