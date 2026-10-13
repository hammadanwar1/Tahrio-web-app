#!/usr/bin/env node
// Crawls every URL in /sitemap.xml and checks on-page SEO.
//   npm run build && npm start  (or any deployed URL)
//   node scripts/seo-audit.mjs http://localhost:3000
// Exits 1 when any page has an error.

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
// Sitemap holds production URLs; fetch them from the server under test.
const toLocal = (u) => base + new URL(u).pathname;

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => decode(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '');
const meta = (html, key) => {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]*>`))?.[0];
  return tag ? attr(tag, 'content') : null;
};

let errors = 0;
let warnings = 0;
const titles = new Map();
const descriptions = new Map();

for (const url of urls) {
  const res = await fetch(toLocal(url), { redirect: 'manual' });
  const html = await res.text();
  const path = new URL(url).pathname;
  const issues = [];
  const err = (m) => issues.push(['ERROR', m]);
  const warn = (m) => issues.push(['warn', m]);

  if (res.status !== 200) err(`HTTP ${res.status}`);
  const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '');
  if (!title) err('missing <title>');
  else if (title.length > 65) warn(`title ${title.length} chars (>65 may truncate)`);
  const desc = meta(html, 'description');
  if (!desc) err('missing meta description');
  else if (desc.length < 70 || desc.length > 160) warn(`description ${desc.length} chars (aim 70–160)`);

  const canonicalTag = html.match(/<link[^>]+rel="canonical"[^>]*>/)?.[0];
  const canonical = canonicalTag ? attr(canonicalTag, 'href') : null;
  if (!canonical) err('missing canonical');
  else if (new URL(canonical).pathname !== path) err(`canonical points elsewhere: ${canonical}`);
  if (siteOrigin && canonical && !canonical.startsWith(siteOrigin)) err(`canonical not on ${siteOrigin}`);

  const robots = meta(html, 'robots') ?? '';
  if (/noindex/.test(robots)) err(`listed in sitemap but robots="${robots}"`);

  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1s !== 1) err(`${h1s} <h1> elements (want exactly 1)`);

  for (const img of html.match(/<img[^>]*>/g) ?? []) {
    if (!/\balt=/.test(img)) err(`<img> without alt: ${img.slice(0, 80)}`);
  }
  if (!meta(html, 'og:title') || !meta(html, 'og:image')) err('missing og:title / og:image');
  if (!meta(html, 'twitter:card')) warn('missing twitter:card');

  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      err(`invalid JSON-LD: ${e.message}`);
    }
  }
  if (path.startsWith('/products/') && !/"@type":"Product"/.test(html)) err('product page without Product JSON-LD');
  if (path !== '/' && !/"@type":"BreadcrumbList"/.test(html)) warn('no BreadcrumbList');

  if (title) titles.set(title, [...(titles.get(title) ?? []), path]);
  if (desc) descriptions.set(desc, [...(descriptions.get(desc) ?? []), path]);

  for (const [level, msg] of issues) {
    if (level === 'ERROR') errors++;
    else warnings++;
    console.log(`${level.padEnd(5)} ${path}  ${msg}`);
  }
}

for (const [t, paths] of titles) {
  if (paths.length > 1) {
    errors++;
    console.log(`ERROR duplicate title "${t}": ${paths.join(', ')}`);
  }
}
for (const [d, paths] of descriptions) {
  if (paths.length > 1) {
    warnings++;
    console.log(`warn  duplicate description on ${paths.join(', ')}: "${d.slice(0, 50)}…"`);
  }
}

console.log(`\nAudited ${urls.length} URLs: ${errors} errors, ${warnings} warnings.`);
process.exit(errors ? 1 : 0);
