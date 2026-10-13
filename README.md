# Tahrio Web App

SEO-first Next.js 16 storefront for **Tahrio**, a mobile accessories store in Pakistan. It shares the
catalog, prices and orders with the Tahrio mobile app through the Tahrio REST API (`../tahrio/backend`).

## Run it

```bash
npm install
cp .env.example .env.local      # set TAHRIO_API_URL / NEXT_PUBLIC_SITE_URL
npm run dev                     # http://localhost:3000
npm run build && npm start      # production
npm run seo:audit -- http://localhost:3000   # crawl the sitemap and check on-page SEO
```

If `TAHRIO_API_URL` is empty or unreachable, pages build from the bundled catalog snapshot
(`src/data/seed.json`) and checkout is disabled, with a WhatsApp fallback.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, e.g. `https://tahrio.pk`, used in canonicals, the sitemap and structured data |
| `TAHRIO_API_URL` | Tahrio API base, e.g. `https://api.tahrio.pk/api` |
| `REVALIDATE_SECRET` | Secret for `POST /api/revalidate`; call it after editing products so pages refresh immediately |
| `TAHRIO_IMAGE_HOST` | Host for remote product photos, if the API returns absolute URLs |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Search Console / Bing verification |

## Routes

| URL | Notes |
|---|---|
| `/` | Home: promo banner, categories, hot deals, new arrivals, trust bar, FAQ |
| `/collections`, `/collections/[slug]` | Category landing pages with unique copy, FAQs and an ItemList (e.g. `/collections/earbuds`) |
| `/products/[slug]` | Product page with photo, price, colours, reviews, related products and a generated share image |
| `/blog`, `/blog/[slug]` | Buying guides that target "best … in Pakistan" searches |
| `/search` | Filters, sort and empty state (`noindex, follow`) |
| `/cart`, `/checkout`, `/order/success`, `/track-order`, `/wishlist` | Guest checkout through the API (COD / JazzCash / Easypaisa / card) |
| `/about`, `/contact`, `/faq`, `/shipping-policy`, `/return-policy`, `/privacy-policy`, `/terms` | Trust and policy pages |

## SEO checklist (implemented)

- **Static HTML for every indexable page.** Products, collections and posts are prerendered and refreshed hourly via `'use cache'`, `cacheLife('hours')` and the tag `catalog`. On-demand refresh goes through `/api/revalidate`.
- **Real 404s.** Unknown product or collection slugs return HTTP 404, because `partialPrefetching` is off. Old URL patterns (`/product/x`, `/category/x`) 308-redirect to the canonical URLs.
- **Unique title and description on every page.**
  - Titles target "<product> price in Pakistan" and stay within 65 characters; the brand suffix is dropped when it wouldn't fit.
  - Descriptions run 70–160 characters.
- **Canonical URL on every page.** It comes from `pageMetadata()`; the root layout sets no canonical, so nothing can leak to child pages.
- **Open Graph and Twitter cards on every page.** Each product gets a share image rendered with its photo and price (`products/[slug]/opengraph-image.tsx`).
- **Structured data (JSON-LD):**
  - OnlineStore organisation with a merchant return policy.
  - WebSite with a sitelinks search box.
  - BreadcrumbList.
  - Product with Offer, strikethrough price, shipping details, return policy, AggregateRating and Review.
  - CollectionPage with ItemList.
  - FAQPage.
  - BlogPosting.
- **Crawl files.**
  - `sitemap.xml` lists every indexable URL, including product image entries.
  - `robots.txt` blocks cart, checkout and the API, and blocks everything on preview deployments.
  - `manifest.webmanifest` and the icons are generated from the brand mark.
- **Content and markup.** One H1 per page, descriptive image `alt` text, a semantic `<article>`/`<nav>`/`<dl>` structure, crawlable `<a href>` links on every card, and a skip link.
- **Performance.**
  - Self-hosted Outfit font via `next/font`.
  - AVIF/WebP via `next/image`, with the first product images eager-loaded for LCP.
  - Minimal client JS: only cart, wishlist and checkout are client islands.
- **Verification.** `npm run seo:audit` fails if any sitemap URL is missing a title, description, canonical, single H1, `alt` text, OG tags or valid JSON-LD.

## Before launch

1. Replace the placeholder phone, email, address and social links in `src/lib/site.ts`. They are published in structured data.
2. Set `NEXT_PUBLIC_SITE_URL` to the live domain and `TAHRIO_API_URL` to the deployed API.
3. Make sure ratings and review counts in the API are real. Google penalises fabricated review markup, and the seed values are demo data.
4. Submit `https://<domain>/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

Product photos are Unsplash/Pexels licensed; see `src/data/PHOTO_CREDITS.md`.
# Tahrio-web-app
