/** Brand mark from Figma "Brand": gradient/button tile with a white "T", plus wordmark. */
export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="bg-gradient-button flex items-center justify-center font-bold text-white"
        style={{ width: size, height: size, borderRadius: size * (20 / 72), fontSize: size * (40 / 72) }}
      >
        T
      </span>
      {withWordmark && <span className="text-xl font-bold tracking-tight">Tahrio</span>}
    </span>
  );
}
