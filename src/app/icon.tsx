import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

const font = readFile(join(process.cwd(), 'src/assets/fonts/Outfit-700.ttf'));

/** Favicon from the Figma brand mark (gradient/button tile + white "T"). */
export default async function Icon() {
  const bold = await font;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 142,
          background: 'linear-gradient(90deg, #22D3EE, #6366F1, #D946EF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'Outfit',
          fontSize: 284,
        }}
      >
        T
      </div>
    ),
    { ...size, fonts: [{ name: 'Outfit', data: bold, weight: 700, style: 'normal' }] },
  );
}
