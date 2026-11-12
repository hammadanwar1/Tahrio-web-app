import { brandGradientCss, markDot, markPath, markStroke, tileRadius } from '@/lib/brand';

/** Brand mark (gradient tile + white "t" and dot, see lib/brand.ts), plus wordmark. */
export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg
        aria-hidden
        viewBox="0 0 512 512"
        width={size}
        height={size}
        className="shrink-0"
        style={{ background: brandGradientCss, borderRadius: size * (tileRadius / 512) }}
      >
        <path
          d={markPath}
          fill="none"
          stroke="#fff"
          strokeWidth={markStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle {...markDot} fill="#fff" />
      </svg>
      {withWordmark && <span className="text-xl font-bold tracking-tight">Tahrio</span>}
    </span>
  );
}
