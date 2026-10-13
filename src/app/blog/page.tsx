import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { posts } from '@/data/blog';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Mobile Accessories Buying Guides & Blog',
  description:
    'Buying guides for earbuds, fast chargers, power banks and phone cases in Pakistan — honest comparisons and tips from the Tahrio team.',
  path: '/blog',
});

const dateFmt = new Intl.DateTimeFormat('en-PK', { dateStyle: 'long', timeZone: 'Asia/Karachi' });

export default function BlogIndex() {
  return (
    <>
      <Breadcrumbs items={[{ name: 'Blog', path: '/blog' }]} />
      <div className="container-page max-w-4xl space-y-6 pt-4">
        <h1 className="text-[32px] font-bold">Buying guides</h1>
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <article className="rounded-card border border-line bg-surface p-6 transition-shadow hover:shadow-card">
                <h2 className="text-xl font-bold">
                  <Link href={`/blog/${p.slug}`} className="hover:text-primary">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-[15px] text-muted">{p.description}</p>
                <time dateTime={p.date} className="mt-3 block text-xs text-muted">
                  {dateFmt.format(new Date(p.date))}
                </time>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
