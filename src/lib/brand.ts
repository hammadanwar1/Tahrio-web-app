/**
 * Tahrio brand mark: a rounded lowercase "t" with a dot (the "spark") on a gradient tile.
 * Single source for the site logo, favicons and share images. Geometry is on a 512×512 grid.
 *
 * Plain TS with no imports so `scripts/brand-assets.ts` can load it directly with Node.
 */

export const brandGradient = ['#22D3EE', '#6366F1', '#D946EF'] as const;
export const brandGradientCss = `linear-gradient(135deg, ${brandGradient[0]} 0%, ${brandGradient[1]} 50%, ${brandGradient[2]} 100%)`;

/** The "t": crossbar, then the stem curling right at the bottom. */
export const markPath = 'M148 196H292M256 122V312Q256 390 334 390';
export const markDot = { cx: 376, cy: 196, r: 32 } as const;
export const markStroke = 64;

/** Corner radius of the tile on the 512 grid (iOS-style squircle-ish rounding). */
export const tileRadius = 144;

/** The white glyph only (no tile), as SVG children. */
function glyph(color: string) {
  return (
    `<path d="${markPath}" fill="none" stroke="${color}" stroke-width="${markStroke}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${markDot.cx}" cy="${markDot.cy}" r="${markDot.r}" fill="${color}"/>`
  );
}

/**
 * Full mark as an SVG string.
 * - `rounded: false` gives a full-bleed square (apple-icon, maskable icons; the OS applies its own mask).
 * - `scale` shrinks the glyph (maskable icons keep it inside the 80% safe zone).
 * - `tile: false` gives the white glyph on transparent (e.g. over a photo or gradient).
 */
export function markSvg({
  rounded = true,
  tile = true,
  scale = 1,
}: { rounded?: boolean; tile?: boolean; scale?: number } = {}) {
  const [a, b, c] = brandGradient;
  const rx = rounded ? tileRadius : 0;
  const bg = tile
    ? `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>` +
      `<rect width="512" height="512" rx="${rx}" fill="url(#g)"/>`
    : '';
  const mark = scale === 1 ? glyph('#fff') : `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${glyph('#fff')}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${bg}${mark}</svg>`;
}

/** Data URI for <img> in ImageResponse (share images). */
export function markDataUri(opts?: Parameters<typeof markSvg>[0]) {
  return `data:image/svg+xml;base64,${Buffer.from(markSvg(opts)).toString('base64')}`;
}
