import Link from 'next/link';

import { getCatalog } from '@/lib/catalog';
import { categoryPath } from '@/lib/catalog-core';
import { site } from '@/lib/site';
import { Logo } from './logo';
import { TrustBar } from './sections';
import { SocialIcon, socialLinks } from './social-icons';

const company = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/login', label: 'Login & Register' },
  { href: '/blog', label: 'Blog & buying guides' },
];
const support = [
  { href: '/track-order', label: 'Track Your Order' },
  { href: '/faq', label: 'FAQs' },
  { href: '/shipping-policy', label: 'Delivery Information' },
  { href: '/return-policy', label: 'Refund & Return Policy' },
  { href: '/terms', label: 'Terms and Conditions' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
];
const shopExtra = [
  { href: '/sale', label: 'On Sale' },
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/brands', label: 'Shop by Brand' },
];

export async function SiteFooter() {
  const { categories } = await getCatalog();
  return (
    <>
      <div className="container-page mt-16">
        <TrustBar />
      </div>
      <footer className="mt-10 bg-ink text-white/80">
        <span aria-hidden className="bg-gradient-button block h-1" />
        <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <span className="text-white">
              <Logo size={44} />
            </span>
            <p className="text-sm leading-relaxed">
              {site.name} brings you original mobile accessories that fit your lifestyle: earbuds, phone cases, fast chargers,
              power banks, cables and smart watches, delivered across Pakistan with cash on delivery.
            </p>
            <ul className="flex gap-3">
              {socialLinks.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener me"
                    aria-label={s.label}
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <SocialIcon name={s.name} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <FooterCol title="Shop" links={[...categories.slice(0, 5).map((c) => ({ href: categoryPath(c), label: c.name })), ...shopExtra]} />
          <FooterCol title="Company" links={company} />
          <FooterCol title="Support" links={support} />
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h2>
            <address className="space-y-3 text-sm not-italic">
              <p>
                <span className="block font-semibold text-white">SMS / WhatsApp</span>
                <a href={`tel:${site.phone.replace(/-/g, '')}`} className="hover:text-white">
                  {site.phone}
                </a>
              </p>
              <p>
                <span className="block font-semibold text-white">Email</span>
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              </p>
              <p>
                <span className="block font-semibold text-white">Address</span>
                {site.address.addressLocality}, Pakistan
              </p>
            </address>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="container-page py-5 text-xs text-white/60">
            © {site.copyrightYear} {site.legalName}. All rights reserved. All prices in PKR, inclusive of taxes. Payment: Cash on
            Delivery.
          </p>
        </div>
      </footer>
    </>
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
