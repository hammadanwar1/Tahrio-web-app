const rsFormat = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

/** 6499 → "Rs 6,499" */
export const rs = (amount: number) => `Rs ${rsFormat.format(amount)}`;

/** 1200 → "1.2k" */
export function compactCount(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, '')}k`;
}

/** "Tahrio Pods Pro ANC" → "tahrio-pods-pro-anc" */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const discountPercent = (price: number, oldPrice: number | null) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;

/** Trim to a meta-description-safe length on a word boundary. */
export function clampText(text: string, max = 158) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
