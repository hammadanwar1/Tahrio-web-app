import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { breadcrumbLd } from '@/lib/jsonld';
import { JsonLd } from './json-ld';

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail + BreadcrumbList structured data (Home is prepended). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: 'Home', path: '/' }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbLd(all)} />
      <nav aria-label="Breadcrumb" className="container-page pt-5">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-medium text-ink">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.path} className="hover:text-primary">
                      {c.name}
                    </Link>
                    <ChevronRight aria-hidden className="size-3.5" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
