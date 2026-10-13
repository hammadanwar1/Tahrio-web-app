import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const font = readFile(join(process.cwd(), 'src/assets/fonts/Outfit-700.ttf'));

/** iOS home-screen icon: square (iOS applies its own mask). */
export default async function AppleIcon() {
  const bold = await font;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #22D3EE, #6366F1, #D946EF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Outfit',
          fontSize: 100,
        }}
      >
        T
      </div>
    ),
    { ...size, fonts: [{ name: 'Outfit', data: bold, weight: 700, style: 'normal' }] },
  );
}
