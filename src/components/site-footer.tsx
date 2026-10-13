import Link from 'next/link';

import { getCatalog } from '@/lib/catalog';
import { categoryPath } from '@/lib/catalog-core';
import { site } from '@/lib/site';
import { Logo } from './logo';

const help = [
  { href: '/track-order', label: 'Track your order' },
  { href: '/faq', label: 'FAQs' },
  { href: '/shipping-policy', label: 'Shipping & delivery' },
  { href: '/return-policy', label: 'Returns & exchanges' },
  { href: '/contact', label: 'Contact us' },
];
const company = [
  { href: '/about', label: 'About Tahrio' },
  { href: '/blog', label: 'Blog & buying guides' },
  { href: '/privacy-policy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of service' },
];

export async function SiteFooter() {
  const { categories } = await getCatalog();
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed">
            {site.tagline}. Original mobile accessories delivered across Pakistan with cash on delivery.
          </p>
          <address className="text-sm not-italic leading-relaxed">
            {site.address.addressLocality}, Pakistan
            <br />
            <a href={`tel:${site.phone.replace(/-/g, '')}`} className="hover:text-white">
              {site.phone}
            </a>
            <br />
            <a href={`mailto:${site.email}`} className="hover:text-white">
              {site.email}
            </a>
          </address>
        </div>
        <FooterCol title="Shop" links={categories.map((c) => ({ href: categoryPath(c), label: c.name }))} />
        <FooterCol title="Help" links={help} />
        <div>
          <FooterCol title="Company" links={company} />
          <ul className="mt-6 flex gap-4 text-sm">
            {Object.entries(site.social).map(([name, href]) => (
              <li key={name}>
                <a href={href} rel="noopener me" target="_blank" className="capitalize hover:text-white">
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-white/60">
          © {site.copyrightYear} {site.legalName}. All prices in PKR, inclusive of taxes.
          Payments: Cash on Delivery, JazzCash, Easypaisa, Visa & Mastercard.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
