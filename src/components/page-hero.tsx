import type { ReactNode } from 'react';

/** Gradient banner at the top of Sale / New Arrivals / Reviews / brand / model pages. */
export function PageHero({
  eyebrow,
  title,
  text,
  children,
  as: H = 'p',
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
  /** The banner title is the page's h1 only where no listing heading follows. */
  as?: 'h1' | 'p';
}) {
  return (
    <section className="bg-gradient-hero relative overflow-hidden rounded-sheet px-6 py-9 text-white sm:px-12 sm:py-12">
      <span aria-hidden className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-28 right-40 size-56 rounded-full bg-[#22d3ee]/20" />
      <div className="relative max-w-2xl space-y-3">
        <p className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest">{eyebrow}</p>
        <H className="text-3xl font-bold leading-tight sm:text-5xl">{title}</H>
        <p className="text-[15px] text-white/85 sm:text-lg">{text}</p>
        {children}
      </div>
    </section>
  );
}
