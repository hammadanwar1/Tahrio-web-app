'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Play } from 'lucide-react';

import { ProductGlyph } from './product-glyph';

/** Main photo / video with a thumbnail strip underneath (when there is more than one item). */
export function ProductGallery({
  images,
  video,
  alt,
  icon,
}: {
  images: string[];
  video?: string | null;
  alt: string;
  icon: string;
}) {
  const items = [...images.map((src) => ({ kind: 'image' as const, src })), ...(video ? [{ kind: 'video' as const, src: video }] : [])];
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-card bg-primary-soft">
        {!current ? (
          <div className="flex h-full items-center justify-center">
            <span className="flex size-3/5 items-center justify-center rounded-full bg-white/70 text-primary">
              <ProductGlyph kind={icon} className="size-1/2" />
            </span>
          </div>
        ) : current.kind === 'video' ? (
          <video
            key={current.src}
            src={current.src}
            poster={images[0]}
            controls
            autoPlay
            muted
            playsInline
            className="size-full bg-ink object-contain"
          />
        ) : (
          <Image
            src={current.src}
            alt={active === 0 ? alt : `${alt} – photo ${active + 1}`}
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
            preload={active === 0}
          />
        )}
      </div>
      {items.length > 1 && (
        <ul className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <li key={item.src} className="shrink-0">
              <button
                type="button"
                aria-label={item.kind === 'video' ? 'Play video' : `Show photo ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={`relative block size-[72px] overflow-hidden rounded-xl border-2 bg-primary-soft sm:size-20 ${
                  i === active ? 'border-primary' : 'border-line hover:border-primary/50'
                }`}
              >
                {item.kind === 'video' ? (
                  <>
                    {images[0] && <Image src={images[0]} alt="" fill sizes="80px" className="object-cover opacity-60" />}
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-white">
                      <Play aria-hidden className="size-7 fill-white" />
                    </span>
                  </>
                ) : (
                  <Image src={item.src} alt="" fill sizes="80px" className="object-cover" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
