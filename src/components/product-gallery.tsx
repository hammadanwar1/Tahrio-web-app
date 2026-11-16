'use client';

import Image from 'next/image';
import { useState } from 'react';

import { ProductGlyph } from './product-glyph';

/** Main photo with thumbnails (when the product has more than one). */
export function ProductGallery({ images, alt, icon }: { images: string[]; alt: string; icon: string }) {
  const [active, setActive] = useState(0);
  const src = images[active];
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-card bg-primary-soft">
        {src ? (
          <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" preload />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="flex size-3/5 items-center justify-center rounded-full bg-white/70 text-primary">
              <ProductGlyph kind={icon} className="size-1/2" />
            </span>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3">
          {images.map((img, i) => (
            <li key={img}>
              <button
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={`relative block size-20 overflow-hidden rounded-xl border-2 ${i === active ? 'border-primary' : 'border-line'}`}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
