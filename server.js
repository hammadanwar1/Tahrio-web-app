// One process for everything: the Tahrio REST API (Express, backend/) and the Next.js storefront
// + admin panel, on a single port.
//   /api/*, /uploads/*  → Express API (used by the mobile app, the storefront and /admin)
//   everything else     → Next.js (also /api/revalidate, which is a Next.js route)
//
// `npm run dev` → node server.js --dev    `npm start` → node server.js (after `npm run build`)
const { createServer } = require('node:http');
const { loadEnvConfig } = require('@next/env');

const dev = process.argv.includes('--dev');
process.env.NODE_ENV ??= dev ? 'development' : 'production';
const port = Number(process.env.PORT) || 3000;

// Load .env* before the API module reads its config (JWT_SECRET, ADMIN_KEY, DATA_DIR…).
loadEnvConfig(__dirname, dev);
const env = process.env;
// The storefront and admin talk to the API in this same process.
env.TAHRIO_API_URL ||= `http://127.0.0.1:${port}/api`;
// One admin key for both sides: the API checks ADMIN_KEY, the admin panel sends TAHRIO_ADMIN_KEY.
env.ADMIN_KEY ||= env.TAHRIO_ADMIN_KEY;
env.TAHRIO_ADMIN_KEY ||= env.ADMIN_KEY;
// Uploaded photo URLs must use the public domain, not the internal 127.0.0.1 address.
env.PUBLIC_URL ||= env.NEXT_PUBLIC_SITE_URL;

const next = require('next');
const api = require('./backend/src/app');

const isApiRequest = (url = '/') => {
  const path = url.split('?')[0];
  if (path === '/api/revalidate' || path.startsWith('/api/revalidate/')) return false;
  return path === '/api' || path.startsWith('/api/') || path.startsWith('/uploads/');
};

const app = next({ dev, dir: __dirname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => (isApiRequest(req.url) ? api(req, res) : handle(req, res))).listen(port, () => {
    console.log(`> Tahrio ready on http://localhost:${port} (${dev ? 'development' : 'production'})`);
    console.log(`> API at http://localhost:${port}/api · admin at http://localhost:${port}/admin`);
    if (!dev) refreshCatalog();
  });
});

// `next build` runs without the API, so pages are prerendered from the bundled seed. Expire that
// snapshot on boot so the first visitors get live products and prices.
function refreshCatalog() {
  if (!env.REVALIDATE_SECRET) return;
  fetch(`http://127.0.0.1:${port}/api/revalidate`, { method: 'POST', headers: { 'x-revalidate-secret': env.REVALIDATE_SECRET } })
    .then((r) => console.log(`> Catalog cache refreshed (${r.status})`))
    .catch((err) => console.warn('> Could not refresh catalog cache:', err.message));
}
