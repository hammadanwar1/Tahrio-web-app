# Tahrio Web App

Everything for **Tahrio**, a mobile accessories store in Pakistan, in one repo and one deploy:

- **Storefront**: SEO-first Next.js 16 site (`src/app/(shop)`).
- **Admin panel** at `/admin` (`src/app/admin`): orders, products, categories, customers.
- **REST API** at `/api` (`backend/`, Express + JSON-file database), also used by the mobile app.

`server.js` runs all three in a single Node process on one port: `/api/*` and `/uploads/*` go to the
API and everything else goes to Next.js.

## Run it

```bash
npm install
cp .env.example .env.local      # set ADMIN_PASSWORD, ADMIN_SESSION_SECRET, ADMIN_KEY…
npm run dev                     # http://localhost:3000 (store), /admin, /api
npm run build && npm start      # production
npm run test:api                # API tests
npm run db:reset                # reset the local database from backend/data/seed.json
npm run seo:audit -- http://localhost:3000   # crawl the sitemap and check on-page SEO
```

Data lives in `backend/data/db.json` and `backend/data/uploads/`, or in `DATA_DIR` if set. Both are
git-ignored and created from `backend/data/seed.json` on first run.

## Deploy

It runs as one service on any host that can run Node.js with a persistent disk: Render, Railway,
Fly.io or a VPS. It can't run on Vercel, because the database and photos are files on disk.

- **Render:** connect the repo and it picks up `render.yaml` (Docker and a 1 GB disk at `/var/data`).
  Set `NEXT_PUBLIC_SITE_URL` and `ADMIN_PASSWORD`; the other secrets are generated.
- **Any Docker host:** `docker build --build-arg NEXT_PUBLIC_SITE_URL=https://tahrio.pk -t tahrio .`,
  then run it with a volume at `/var/data` and the env vars from `.env.example`.
- **The mobile app:** point its API base URL at `https://<your-domain>/api`.

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
