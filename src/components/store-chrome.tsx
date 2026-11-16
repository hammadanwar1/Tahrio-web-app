import type { ReactNode } from 'react';

import { JsonLd } from '@/components/json-ld';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SocialIcon, whatsappUrl } from '@/components/social-icons';
import { StoreProvider } from '@/components/store-provider';
import { organizationLd, websiteLd } from '@/lib/jsonld';

/** Storefront shell: header, footer, cart/wishlist store and site-wide JSON-LD (not used by /admin). */
export function StoreChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <JsonLd data={[organizationLd(), websiteLd()]} />
      <StoreProvider>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noopener"
          aria-label="Chat with us on WhatsApp"
          className="fixed bottom-5 left-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-nav transition-transform hover:scale-105"
        >
          <SocialIcon name="whatsapp" className="size-7" />
        </a>
      </StoreProvider>
    </>
  );
}
