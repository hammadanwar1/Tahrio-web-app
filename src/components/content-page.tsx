import type { ReactNode } from 'react';

import { Breadcrumbs } from './breadcrumbs';

/** Layout for text pages (policies, about, contact). */
export function ContentPage({ title, path, intro, children }: { title: string; path: string; intro?: string; children: ReactNode }) {
  return (
    <>
      <Breadcrumbs items={[{ name: title, path }]} />
      <article className="container-page max-w-3xl pt-4">
        <h1 className="mb-3 text-[30px] font-bold leading-tight sm:text-[34px]">{title}</h1>
        {intro && <p className="mb-8 text-lg leading-relaxed text-muted">{intro}</p>}
        <div className="space-y-4 text-[15px] leading-relaxed [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_a]:font-medium [&_a]:text-primary">
          {children}
        </div>
      </article>
    </>
  );
}
