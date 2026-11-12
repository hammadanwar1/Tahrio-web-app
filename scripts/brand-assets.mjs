// Generates the favicon, app icons and logo files from the mark in src/lib/brand.ts.
// Run after changing the mark: `npm run brand:assets` (Node 23.6+ loads the .ts file directly).
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

import { markSvg } from '../src/lib/brand.ts';

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

/** .ico holding PNG images (supported by every current browser). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size % 256, e);
    header.writeUInt8(size % 256, e + 1);
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const rounded = markSvg();
const square = markSvg({ rounded: false });
const maskable = markSvg({ rounded: false, scale: 0.8 });

const files = {
  // Browser tab: .ico for old browsers / Google, SVG for sharp rendering at any size.
  'src/app/favicon.ico': ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) })))),
  'src/app/icon.svg': rounded,
  // iOS rounds the corners itself.
  'src/app/apple-icon.png': await png(square, 180),
  // Android / PWA (manifest.ts).
  'public/brand/icon-192.png': await png(rounded, 192),
  'public/brand/icon-512.png': await png(rounded, 512),
  'public/brand/icon-maskable-512.png': await png(maskable, 512),
  // Organization logo for Google (JSON-LD) and general use.
  'public/brand/logo.png': await png(rounded, 1024),
  'public/brand/logo.svg': rounded,
};

for (const [path, data] of Object.entries(files)) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  console.log(`wrote ${path}`);
}
