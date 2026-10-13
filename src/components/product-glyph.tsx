import {
  Battery,
  Cable,
  Car,
  Headphones,
  MonitorSmartphone,
  PlugZap,
  Smartphone,
  Speaker,
  Watch,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Product/category glyphs (Figma "ProductIcon set" — Lucide-style, 1.8 stroke). Keys = API `icon`. */
const glyphs: Record<string, LucideIcon> = {
  case: Smartphone,
  earbuds: Headphones,
  charger: PlugZap,
  cable: Cable,
  powerbank: Zap,
  watch: Watch,
  screenguard: MonitorSmartphone,
  stand: Smartphone,
  speaker: Speaker,
  car: Car,
  battery: Battery,
};

export function ProductGlyph({ kind, className }: { kind: string; className?: string }) {
  const Icon = glyphs[kind] ?? Smartphone;
  return <Icon aria-hidden strokeWidth={1.8} className={className} />;
}
