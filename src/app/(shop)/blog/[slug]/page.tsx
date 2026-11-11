import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { ProductGrid } from '@/components/product-card';
import { findPost, posts } from '@/data/blog';
import { getCatalog } from '@/lib/catalog';
import { categoryPath, withDiscount } from '@/lib/catalog-core';
import { pageMetadata } from '@/lib/seo';
import { absoluteUrl, site } from '@/lib/site';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = findPost((await params).slug);
  if (!post) notFound();
  const meta = pageMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}`, type: 'article' });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: 'article', publishedTime: post.date, modifiedTime: post.updated ?? post.date, authors: [post.author] },
  };
}

const dateFmt = new Intl.DateTimeFormat('en-PK', { dateStyle: 'long', timeZone: 'Asia/Karachi' });

export default async function BlogPost({ params }: PageProps<'/blog/[slug]'>) {
  const post = findPost((await params).slug);
  if (!post) notFound();
  const catalog = await getCatalog();
  const byId = new Map(catalog.products.map((p) => [p.id, withDiscount(p)]));
  const category = catalog.categories.find((c) => c.id === post.categoryId);
  const path = `/blog/${post.slug}`;

  return (
    <>
      <Breadcrumbs items={[{ name: 'Blog', path: '/blog' }, { name: post.title, path }]} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          inLanguage: site.language,
          mainEntityOfPage: absoluteUrl(path),
          image: absoluteUrl('/opengraph-image'),
          author: { '@type': 'Organization', name: post.author, url: site.url },
          publisher: { '@id': `${site.url}/#organization` },
          keywords: post.keyword,
        }}
      />
      <article className="container-page max-w-3xl pt-4">
        <header className="mb-8 space-y-3">
          <h1 className="text-[30px] font-bold leading-tight sm:text-[36px]">{post.title}</h1>
          <p className="text-sm text-muted">
            By {post.author} · <time dateTime={post.updated ?? post.date}>Updated {dateFmt.format(new Date(post.updated ?? post.date))}</time>
          </p>
          <p className="text-lg leading-relaxed text-muted">{post.intro}</p>
        </header>
        {post.sections.map((s) => (
          <section key={s.heading} className="mb-10 space-y-3">
            <h2 className="text-2xl font-bold">{s.heading}</h2>
            {s.body.map((para) => (
              <p key={para.slice(0, 24)} className="text-[16px] leading-relaxed">
                {para}
              </p>
            ))}
            {s.products?.length ? (
              <div className="pt-2">
                <ProductGrid products={s.products.map((id) => byId.get(id)).filter((p) => p !== undefined)} />
              </div>
            ) : null}
          </section>
        ))}
        {category && (
          <p className="rounded-card bg-primary-soft p-5 text-[15px]">
            Browse all{' '}
            <Link href={categoryPath(category)} className="font-semibold text-primary hover:underline">
              {category.name.toLowerCase()} in Pakistan
            </Link>{' '}
            with cash on delivery across Pakistan.
          </p>
        )}
      </article>
    </>
  );
}
