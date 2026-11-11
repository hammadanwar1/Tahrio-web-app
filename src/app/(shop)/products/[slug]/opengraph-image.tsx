import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

import { getCatalog } from '@/lib/catalog';
import { findProductBySlug, productImage, productSlug, withDiscount } from '@/lib/catalog-core';
import { rs } from '@/lib/format';

export const alt = 'Tahrio product';
export const size = { width: 1200, height: 630 };
// JPEG, not PNG: with the product photo a PNG card is ~300 KB, and WhatsApp drops preview images
// above that. As JPEG it is a fraction of the size.
export const contentType = 'image/jpeg';

const fonts = Promise.all([
  readFile(join(process.cwd(), 'src/assets/fonts/Outfit-700.ttf')),
  readFile(join(process.cwd(), 'src/assets/fonts/Outfit-500.ttf')),
]);

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ slug: productSlug(p) }));
}

/** Social share card: photo + name + price, branded with gradient/hero. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const found = findProductBySlug(catalog, slug);
  const [bold, medium] = await fonts;
  const p = found ? withDiscount(found) : null;
  const img = p ? productImage(p) : null;
  const photo = img?.startsWith('/')
    ? `data:image/jpeg;base64,${(await readFile(join(process.cwd(), 'public', img))).toString('base64')}`
    : img;

  const png = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(169deg, #1D4ED8 8%, #6D28D9 54%, #A21CAF 92%)',
          color: 'white',
          fontFamily: 'Outfit',
          padding: 56,
          gap: 48,
          alignItems: 'center',
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={480} height={480} style={{ borderRadius: 40, objectFit: 'cover' }} alt="" />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(90deg, #22D3EE, #6366F1, #D946EF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              T
            </div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Tahrio</div>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{p?.fullName ?? 'Mobile accessories'}</div>
          {p && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 44, fontWeight: 700 }}>
              {rs(p.price)}
              {p.discount ? (
                <div style={{ fontSize: 28, fontWeight: 500, background: 'rgba(255,255,255,.2)', padding: '6px 18px', borderRadius: 40 }}>
                  {`-${p.discount}%`}
                </div>
              ) : null}
            </div>
          )}
          <div style={{ fontSize: 26, fontWeight: 500, opacity: 0.85 }}>Cash on delivery across Pakistan</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Outfit', data: bold, weight: 700, style: 'normal' },
        { name: 'Outfit', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'content-type': contentType } });
}
