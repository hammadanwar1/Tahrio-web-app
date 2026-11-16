import Image from 'next/image';
import Link from 'next/link';

export interface BrandTileData {
  name: string;
  href: string;
  color: string;
  logoUrl: string | null;
  count: number;
}

/** Brand logo (or its name in colour, until a logo is uploaded) in a bordered grid cell. */
export function BrandTile({ brand: b, height = 'h-24' }: { brand: BrandTileData; height?: string }) {
  return (
    <Link
      href={b.href}
      title={b.name}
      className={`group flex ${height} flex-col items-center justify-center gap-1 px-4 text-center transition-colors hover:bg-primary-soft`}
    >
      {b.logoUrl ? (
        <span className="relative h-12 w-full max-w-36">
          <Image
            src={b.logoUrl}
            alt={b.name}
            fill
            sizes="144px"
            className="object-contain transition-transform group-hover:scale-105"
          />
        </span>
      ) : (
        <span className="text-[22px] font-bold leading-tight tracking-tight" style={{ color: b.color }}>
          {b.name}
        </span>
      )}
      {b.count > 0 && (
        <span className="text-xs text-muted">
          {b.count} {b.count === 1 ? 'product' : 'products'}
        </span>
      )}
    </Link>
  );
}
