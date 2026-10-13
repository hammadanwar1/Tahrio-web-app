import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Tahrio – original mobile accessories in Pakistan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const font = readFile(join(process.cwd(), 'src/assets/fonts/Outfit-700.ttf'));

/** Default share card for the site (pages without their own opengraph-image inherit it). */
export default async function Image() {
  const bold = await font;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          gap: 28,
          color: 'white',
          fontFamily: 'Outfit',
          background: 'linear-gradient(169deg, #1D4ED8 8%, #6D28D9 54%, #A21CAF 92%)',
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 34,
            background: 'linear-gradient(90deg, #22D3EE, #6366F1, #D946EF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 68,
          }}
        >
          T
        </div>
        <div style={{ fontSize: 84, lineHeight: 1 }}>Tahrio</div>
        <div style={{ fontSize: 44, opacity: 0.9 }}>Original mobile accessories in Pakistan</div>
        <div style={{ fontSize: 30, opacity: 0.8 }}>Earbuds · Cases · Chargers · Power Banks · Cash on delivery</div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Outfit', data: bold, weight: 700, style: 'normal' }] },
  );
}
