import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Headphones, PackageCheck, ShieldCheck, Star, Truck } from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { PageHero } from '@/components/page-hero';
import { FaqList } from '@/components/sections';
import { SocialIcon, whatsappUrl } from '@/components/social-icons';
import { getCatalog } from '@/lib/catalog';
import { productImage, productPath } from '@/lib/catalog-core';
import { compactCount } from '@/lib/format';
import { faqLd } from '@/lib/jsonld';
import { pageMetadata } from '@/lib/seo';
import { site } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Customer Reviews – Trusted Mobile Accessories Store in Pakistan',
  description: `Real, verified customer reviews of ${site.name}: original mobile accessories, fast delivery and cash on delivery across Pakistan.`,
  path: '/reviews',
  keywords: ['Tahrio reviews', 'trusted mobile accessories store Pakistan', 'original accessories reviews Pakistan'],
});

const faqs = [
  {
    q: 'Can I trust the reviews on Tahrio?',
    a: 'Yes. Reviews marked "Verified buyer" come from customers who received the product through a Tahrio order.',
  },
  {
    q: 'How can I leave a review?',
    a: `After your order is delivered, send us your feedback on WhatsApp (${site.phone}) and we will publish it on the product page.`,
  },
  {
    q: 'How does Tahrio make sure products are original?',
    a: 'Every item is sourced from authorised suppliers and quality-checked before dispatch. If anything is wrong you can return it within 7 days.',
  },
];

const reasons = [
  { icon: BadgeCheck, title: '100% original products', text: 'Sourced from authorised suppliers, checked before dispatch.' },
  { icon: ShieldCheck, title: 'Cash on delivery', text: 'Pay only when the parcel is in your hands.' },
  { icon: Truck, title: 'Fast delivery across Pakistan', text: `${site.policy.deliveryDays.min}–${site.policy.deliveryDays.max} working days to every city.` },
  { icon: PackageCheck, title: `${site.policy.returnDays}-day easy returns`, text: 'Not happy? Return or exchange, no hassle.' },
  { icon: Headphones, title: 'Helpful support', text: 'Real people on WhatsApp to help before and after you buy.' },
];

export default async function ReviewsPage() {
  const catalog = await getCatalog();
  const byId = new Map(catalog.products.map((p) => [p.id, p]));
  const reviews = catalog.reviews.filter((r) => byId.has(r.productId));
  const ratings = catalog.products.reduce((n, p) => n + p.reviews, 0);
  const average = ratings ? catalog.products.reduce((s, p) => s + p.rating * p.reviews, 0) / ratings : 0;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));

  return (
    <>
      <Breadcrumbs items={[{ name: 'Reviews', path: '/reviews' }]} />
      <JsonLd data={faqLd(faqs)} />
      <div className="container-page space-y-12 pt-4">
        <PageHero
          as="h1"
          eyebrow="Real & verified"
          title="Verified Customer Reviews"
          text={`What shoppers from across Pakistan say about ${site.name}.`}
        />

        <section aria-label="Rating summary" className="grid gap-6 rounded-sheet border border-line bg-surface p-6 sm:p-8 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center gap-2 px-6 text-center md:border-r md:border-line">
            <p className="text-6xl font-bold">{average.toFixed(1)}</p>
            <Stars rating={Math.round(average)} size="size-6" />
            <p className="text-sm text-muted">Based on {compactCount(ratings)} ratings</p>
          </div>
          <ul className="space-y-2 self-center">
            {breakdown.map((b) => (
              <li key={b.stars} className="flex items-center gap-3 text-sm">
                <span className="flex w-10 items-center gap-1">
                  {b.stars} <Star aria-hidden className="size-3.5 fill-star text-star" />
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                  <span
                    className="bg-gradient-button block h-full rounded-full"
                    style={{ width: `${reviews.length ? (b.count / reviews.length) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-8 text-right text-muted">{b.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-bold">Don&apos;t take our word for it – trust our customers</h2>
          <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {reviews.map((r) => {
              const p = byId.get(r.productId)!;
              const img = productImage(p);
              return (
                <li key={r.id} className="mb-5 break-inside-avoid rounded-card border border-line bg-surface p-5 shadow-card">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-gradient-button flex size-10 items-center justify-center rounded-full font-bold text-white">
                        {r.userName.charAt(0)}
                      </span>
                      <div>
                        <p className="font-semibold">{r.userName}</p>
                        {r.verified && (
                          <p className="flex items-center gap-1 text-xs text-success">
                            <BadgeCheck aria-hidden className="size-3.5" /> Verified buyer
                          </p>
                        )}
                      </div>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-[15px] leading-relaxed">{r.text}</p>
                  <Link href={productPath(p)} className="mt-4 flex items-center gap-3 rounded-xl bg-bg p-2 hover:bg-primary-soft">
                    {img && <Image src={img} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" />}
                    <span className="line-clamp-1 text-sm font-medium text-primary">{p.fullName}</span>
                  </Link>
                  <time dateTime={r.createdAt} className="mt-3 block text-xs text-muted">
                    {new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeZone: 'Asia/Karachi' }).format(new Date(r.createdAt))}
                  </time>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Why customers trust {site.name}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {reasons.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-card border border-line bg-surface p-5">
                <span className="bg-gradient-button mb-3 flex size-11 items-center justify-center rounded-xl text-white">
                  <Icon aria-hidden className="size-5" />
                </span>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="bg-gradient-hero flex flex-col justify-center gap-4 rounded-sheet p-8 text-white">
            <h2 className="text-2xl font-bold">Bought from us? Tell us how it went.</h2>
            <p className="text-white/85">Send your review and a photo on WhatsApp and we&apos;ll feature it here.</p>
            <a
              href={whatsappUrl(`Hi ${site.name}, I'd like to leave a review:`)}
              className="flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-ink"
            >
              <SocialIcon name="whatsapp" className="size-5 text-[#25d366]" /> Review on WhatsApp
            </a>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold">Frequently asked questions</h2>
            <FaqList faqs={faqs} />
          </div>
        </section>
      </div>
    </>
  );
}

function Stars({ rating, size = 'size-4' }: { rating: number; size?: string }) {
  return (
    <span className="flex shrink-0 gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden className={`${size} ${i < rating ? 'fill-star text-star' : 'text-line'}`} />
      ))}
    </span>
  );
}
