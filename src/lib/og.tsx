import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';

import { markDataUri } from './brand';

/** Shared pieces for the share (Open Graph) images. */

export const ogSize = { width: 1200, height: 630 };
export const ogBackground = 'linear-gradient(160deg, #0F1433 0%, #1D2A8A 45%, #6D28D9 80%, #A21CAF 100%)';

const fonts = Promise.all([
  readFile(join(process.cwd(), 'src/assets/fonts/Outfit-700.ttf')),
  readFile(join(process.cwd(), 'src/assets/fonts/Outfit-500.ttf')),
]);

const mark = markDataUri();

/** Product photo as something <img> in ImageResponse can load (local files are inlined). */
export async function ogPhoto(src: string | null | undefined) {
  if (!src) return null;
  if (!src.startsWith('/')) return src;
  try {
    return `data:image/jpeg;base64,${(await readFile(join(process.cwd(), 'public', src))).toString('base64')}`;
  } catch {
    return null;
  }
}

/** Logo mark + "Tahrio" wordmark. */
export function OgLockup({ size = 64 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mark} width={size} height={size} alt="" />
      <div style={{ fontSize: size * 0.62, fontWeight: 700, letterSpacing: -1 }}>Tahrio</div>
    </div>
  );
}

/** Small pill, e.g. "Cash on delivery". */
export function OgPill({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        fontSize: 24,
        fontWeight: 500,
        padding: '10px 22px',
        borderRadius: 40,
        background: 'rgba(255,255,255,.14)',
        border: '1px solid rgba(255,255,255,.25)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Renders the card and returns it as JPEG. Cards with photos are ~300 KB as PNG, and WhatsApp drops
 * preview images above that; as JPEG they are a fraction of the size.
 */
export async function ogJpeg(element: React.ReactElement) {
  const [bold, medium] = await fonts;
  const png = new ImageResponse(element, {
    ...ogSize,
    fonts: [
      { name: 'Outfit', data: bold, weight: 700, style: 'normal' },
      { name: 'Outfit', data: medium, weight: 500, style: 'normal' },
    ],
  });
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { 'content-type': 'image/jpeg' } });
}
