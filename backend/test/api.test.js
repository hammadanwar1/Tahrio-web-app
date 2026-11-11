const test = require('node:test');
const assert = require('node:assert');
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tahrio-'));
const app = require('../src/app');

let base;
let server;
let token;

async function call(method, url, body, headers = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(() => server.close());

test('catalog', async () => {
  const cats = await call('GET', '/categories');
  assert.equal(cats.body.length, 10);
  assert.equal(cats.body.find((c) => c.id === 'earbuds').itemCount, 6);

  const hot = await call('GET', '/products?section=hot');
  assert.equal(hot.body.items[0].id, 'p-pods-pro-anc');
  assert.equal(hot.body.items[0].discount, 28);

  const anc = await call('GET', '/products?categoryId=earbuds&tag=ANC');
  assert.deepEqual(anc.body.items.map((p) => p.id), ['p-pods-pro-anc']);

  const search = await call('GET', '/products?q=earbuds');
  assert.equal(search.body.total, 6);

  const none = await call('GET', '/products?q=airpod%20case%203');
  assert.equal(none.body.total, 0);

  const sugg = await call('GET', '/search/suggestions?q=earb');
  assert.ok(sugg.body.phrases[0].startsWith('earb'));
  assert.equal(sugg.body.products.length, 2);

  const pods = await call('GET', '/products/p-pods-pro-anc');
  assert.equal(pods.body.videoUrl, 'assets/videos/product_demo.mp4');
  const reviews = await call('GET', '/products/p-pods-pro-anc/reviews');
  assert.equal(reviews.body.length, 4);
  assert.ok(reviews.body.every((r) => r.productId === 'p-pods-pro-anc' && r.rating >= 1 && r.text));
  assert.ok(reviews.body[0].createdAt >= reviews.body[1].createdAt);
  assert.equal((await call('GET', '/products/nope/reviews')).status, 404);
});

test('auth + cart + checkout + tracking', async () => {
  const bad = await call('POST', '/auth/login', { phone: '+92 300 1234567', password: 'nope' });
  assert.equal(bad.status, 401);

  const login = await call('POST', '/auth/login', { phone: '+92 300 1234567', password: 'password' });
  assert.equal(login.status, 200);
  token = login.body.token;

  const cart = await call('GET', '/cart?promo=TAHRIO500');
  assert.equal(cart.body.subtotal, 10197);
  assert.equal(cart.body.discount, 500);
  assert.equal(cart.body.deliveryFee, 150); // standard delivery
  assert.equal(cart.body.total, 9847);

  await call('PUT', '/wishlist/p-buds-lite');
  const wl = await call('GET', '/wishlist');
  assert.equal(wl.body[0].id, 'p-buds-lite');

  const addrs = await call('GET', '/addresses');
  const order = await call('POST', '/orders', {
    addressId: addrs.body[0].id, deliveryMethodId: 'standard', paymentMethodId: 'cod', promoCode: 'TAHRIO500',
  });
  assert.equal(order.status, 201);
  assert.equal(order.body.number, 'TR-20481');
  assert.equal(order.body.total, 9847);
  assert.equal(order.body.status, 'packed');

  const empty = await call('GET', '/cart');
  assert.equal(empty.body.items.length, 0);

  const adv = await call('POST', `/admin/orders/${order.body.number}/advance`, null, { 'x-admin-key': 'tahrio-admin' });
  assert.equal(adv.body.status, 'out_for_delivery');
});

test('guest + register', async () => {
  token = null;
  const g = await call('POST', '/auth/guest');
  assert.equal(g.body.user.isGuest, true);
  const r = await call('POST', '/auth/register', { name: 'Ali', phone: '0321-7654321', password: 'secret1' });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.phone, '03217654321');
});

test('admin products: create, edit, upload, delete', async () => {
  token = null;
  const admin = { 'x-admin-key': 'tahrio-admin' };

  assert.equal((await call('POST', '/admin/products', { name: 'X', categoryId: 'cables', price: 100 })).status, 403);
  assert.equal((await call('POST', '/admin/products', { name: 'X', categoryId: 'nope', price: 100 }, admin)).status, 400);
  assert.equal((await call('POST', '/admin/products', { name: 'X', categoryId: 'cables' }, admin)).status, 400);

  const created = await call(
    'POST',
    '/admin/products',
    { name: 'Test Cable', categoryId: 'cables', price: 900, oldPrice: 1200, tags: ['USB-C', 'USB-C'], rating: 5, reviews: 999, id: 'hijack' },
    admin,
  );
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.notEqual(id, 'hijack');
  assert.equal(created.body.rating, 0);
  assert.equal(created.body.reviews, 0);
  assert.equal(created.body.icon, 'cable');
  assert.equal(created.body.discount, 25);
  assert.deepEqual(created.body.tags, ['USB-C']);

  // Visible to the storefront + app through the public catalog.
  const pub = await call('GET', '/products?categoryId=cables');
  assert.ok(pub.body.items.some((p) => p.id === id));

  const patched = await call('PATCH', `/admin/products/${id}`, { price: 800, inStock: false, colors: [{ name: 'Black', hex: '#000000' }] }, admin);
  assert.equal(patched.body.price, 800);
  assert.equal(patched.body.inStock, false);
  assert.equal(patched.body.name, 'Test Cable');
  assert.equal((await call('PATCH', `/admin/products/${id}`, { colors: [{ name: 'Bad', hex: 'red' }] }, admin)).status, 400);

  const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4f20000000049454e44ae426082', 'hex');
  const up = await fetch(`${base}/admin/uploads`, { method: 'POST', headers: { 'content-type': 'image/png', ...admin }, body: png });
  assert.equal(up.status, 201);
  const { url } = await up.json();
  const img = await fetch(url);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
  const bad = await fetch(`${base}/admin/uploads`, { method: 'POST', headers: { 'content-type': 'image/png', ...admin }, body: 'not an image' });
  assert.equal(bad.status, 400);

  assert.equal((await call('DELETE', `/admin/products/${id}`, null, admin)).status, 204);
  assert.equal((await call('GET', `/products/${id}`)).status, 404);
});

const admin = { 'x-admin-key': 'tahrio-admin' };

test('admin products: drafts, channels, stock, specs, video upload', async () => {
  token = null;
  const draft = await call(
    'POST',
    '/admin/products',
    {
      name: 'Draft Speaker', categoryId: 'speakers', price: 4999, status: 'draft', sku: 'TP-SP-005', stock: 0,
      highlights: ['Loud', ' '], specs: [{ key: 'Bluetooth', value: '5.3' }, { key: '', value: '' }],
      images: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'], channels: ['web'],
    },
    admin,
  );
  assert.equal(draft.status, 201);
  const id = draft.body.id;
  assert.equal(draft.body.inStock, false);
  assert.equal(draft.body.imageUrl, 'https://cdn.example.com/a.jpg');
  assert.deepEqual(draft.body.highlights, ['Loud']);
  assert.deepEqual(draft.body.specs, [{ key: 'Bluetooth', value: '5.3' }]);
  assert.equal((await call('POST', '/admin/products', { name: 'X', categoryId: 'speakers', price: 1, status: 'live' }, admin)).status, 400);
  assert.equal((await call('POST', '/admin/products', { name: 'X', categoryId: 'speakers', price: 1, specs: [{ key: 'Only key' }] }, admin)).status, 400);

  // Drafts never reach customers; admins still see them.
  assert.equal((await call('GET', `/products/${id}`)).status, 404);
  assert.ok(!(await call('GET', '/products?q=draft speaker')).body.items.length);
  assert.equal((await call('GET', `/admin/products/${id}`, null, admin)).body.sku, 'TP-SP-005');
  const before = (await call('GET', '/categories')).body.find((c) => c.id === 'speakers').itemCount;
  const adminCount = (await call('GET', '/admin/categories', null, admin)).body.find((c) => c.id === 'speakers').itemCount;
  assert.equal(adminCount, before + 1);

  await call('PATCH', `/admin/products/${id}`, { status: 'published', stock: 12 }, admin);
  const web = await call('GET', '/products?channel=web&q=draft speaker');
  const app = await call('GET', '/products?channel=app&q=draft speaker');
  assert.equal(web.body.items[0].inStock, true);
  assert.equal(app.body.items.length, 0);

  const mp4 = Buffer.concat([Buffer.from('000000186674797069736f6d', 'hex'), Buffer.alloc(32)]);
  const up = await fetch(`${base}/admin/uploads`, { method: 'POST', headers: { 'content-type': 'video/mp4', ...admin }, body: mp4 });
  assert.equal(up.status, 201);
  assert.match((await up.json()).url, /\.mp4$/);
  const fake = await fetch(`${base}/admin/uploads`, { method: 'POST', headers: { 'content-type': 'video/mp4', ...admin }, body: 'nope' });
  assert.equal(fake.status, 400);
  await call('DELETE', `/admin/products/${id}`, null, admin);
});

test('admin categories: create, discount badge + pricing, reorder, delete', async () => {
  token = null;
  assert.equal((await call('GET', '/admin/categories')).status, 403);
  const created = await call('POST', '/admin/categories', { name: 'Gaming Accessories', icon: 'speaker', discountPercent: 15 }, admin);
  assert.equal(created.status, 201);
  assert.equal(created.body.id, 'gaming-accessories');
  assert.equal(created.body.badge, '-15%');
  assert.equal((await call('POST', '/admin/categories', { name: 'X', parentId: 'nope' }, admin)).status, 400);
  assert.equal((await call('POST', '/admin/categories', { name: 'X', discountPercent: 95 }, admin)).status, 400);

  // Category discount applies to products without their own sale.
  const p = await call('POST', '/admin/products', { name: 'Pad', categoryId: 'gaming-accessories', price: 1000 }, admin);
  const pub = await call('GET', `/products/${p.body.id}`);
  assert.equal(pub.body.price, 850);
  assert.equal(pub.body.oldPrice, 1000);
  assert.equal(pub.body.discount, 15);
  assert.equal(p.body.price, 1000);
  assert.equal(p.body.effective.price, 850);
  assert.equal((await call('DELETE', '/admin/categories/gaming-accessories', null, admin)).status, 409);
  await call('DELETE', `/admin/products/${p.body.id}`, null, admin);

  const patched = await call('PATCH', '/admin/categories/gaming-accessories', { discountPercent: 0, showOnHome: false }, admin);
  assert.equal(patched.body.badge, null);
  assert.equal(patched.body.showOnHome, false);

  const ids = (await call('GET', '/admin/categories', null, admin)).body.map((c) => c.id);
  const reordered = await call('POST', '/admin/categories/reorder', { ids: [...ids].reverse() }, admin);
  assert.equal(reordered.body[0].id, 'gaming-accessories');
  assert.equal((await call('POST', '/admin/categories/reorder', { ids: ids.slice(1) }, admin)).status, 400);
  await call('POST', '/admin/categories/reorder', { ids }, admin);

  assert.equal((await call('DELETE', '/admin/categories/gaming-accessories', null, admin)).status, 204);
});

test('admin discounts + coupons', async () => {
  token = null;
  const day = 24 * 60 * 60 * 1000;
  assert.equal((await call('POST', '/admin/discounts', { name: 'X', scope: 'categories', targetIds: [], type: 'percent', value: 10 }, admin)).status, 400);
  assert.equal((await call('POST', '/admin/discounts', { name: 'X', scope: 'all', type: 'percent', value: 95 }, admin)).status, 400);

  const sale = await call(
    'POST',
    '/admin/discounts',
    {
      name: 'Mega Sale · Up to 40% OFF', scope: 'categories', targetIds: ['chargers'], type: 'percent', value: 40,
      startsAt: new Date(Date.now() - day).toISOString(), endsAt: new Date(Date.now() + 10 * day).toISOString(), showBanner: true,
    },
    admin,
  );
  assert.equal(sale.status, 201);
  assert.equal(sale.body.status, 'live');
  const banners = (await call('GET', '/banners?placement=home')).body;
  assert.equal(banners[0].title, 'Up to 40% OFF');

  // Products with their own sale keep it; others get the campaign price.
  const chargers = (await call('GET', '/products?categoryId=chargers')).body.items;
  const plain = chargers.find((c) => c.discount === 40);
  assert.ok(plain, 'a charger without its own sale gets 40% off');

  const later = await call(
    'POST',
    '/admin/discounts',
    { name: '11.11 Sale', scope: 'all', type: 'flat', value: 100, startsAt: new Date(Date.now() + 20 * day).toISOString() },
    admin,
  );
  assert.equal(later.body.status, 'scheduled');

  await call('PATCH', `/admin/discounts/${sale.body.id}`, { showBanner: false }, admin);
  assert.ok(!(await call('GET', '/banners?placement=home')).body.some((b) => b.discountId === sale.body.id));
  const listed = await call('GET', '/admin/discounts', null, admin);
  assert.equal(listed.body.stats.active, 1);
  await call('DELETE', `/admin/discounts/${sale.body.id}`, null, admin);
  await call('DELETE', `/admin/discounts/${later.body.id}`, null, admin);
  assert.ok(!(await call('GET', '/products?categoryId=chargers')).body.items.some((c) => c.discount === 40));

  assert.equal((await call('POST', '/admin/coupons', { code: 'tahrio500', type: 'flat', amount: 10 }, admin)).status, 409);
  assert.equal((await call('POST', '/admin/coupons', { code: 'a!', type: 'flat', amount: 10 }, admin)).status, 400);
  const c = await call('POST', '/admin/coupons', { code: 'newuser10', type: 'percent', amount: 10, maxDiscount: 1000, maxUses: 1 }, admin);
  assert.equal(c.body.code, 'NEWUSER10');
  assert.equal(c.body.status, 'active');

  const login = await call('POST', '/auth/login', { phone: '03001234567', password: 'password' });
  token = login.body.token;
  await call('POST', '/cart/items', { productId: 'p-pods-pro-anc', qty: 1 });
  const ok = await call('POST', '/promo/validate', { code: 'NEWUSER10' });
  assert.equal(ok.body.valid, true);
  await call('PATCH', '/admin/coupons/NEWUSER10', { maxUses: 1 }, admin);
  const addrs = await call('GET', '/addresses');
  await call('POST', '/orders', { addressId: addrs.body[0].id, deliveryMethodId: 'standard', paymentMethodId: 'cod', promoCode: 'NEWUSER10' });
  const usedUp = await call('POST', '/promo/validate', { code: 'NEWUSER10' });
  assert.equal(usedUp.body.valid, false);
  assert.equal((await call('DELETE', '/admin/coupons/NEWUSER10', null, admin)).status, 204);
  token = null;
});

test('admin users, login activity, blocking, dashboard', async () => {
  token = null;
  await call('POST', '/auth/login', { phone: '03001234567', password: 'wrong' }, { 'user-agent': 'Mozilla/5.0 (iPhone) Safari/604.1' });
  const ok = await call('POST', '/auth/login', { phone: '03001234567', password: 'password' }, { 'x-client-platform': 'app', 'x-client-device': 'iPhone 15', 'x-client-city': 'Lahore' });
  assert.equal(ok.status, 200);

  const events = await call('GET', '/admin/login-events?range=today', null, admin);
  const [latest, failed] = events.body.items;
  assert.equal(latest.result, 'success');
  assert.equal(latest.device, 'iPhone 15');
  assert.equal(latest.city, 'Lahore');
  assert.equal(latest.platform, 'app');
  assert.equal(latest.online, true);
  assert.equal(failed.result, 'failed');
  assert.equal(failed.reason, 'wrong password');
  assert.equal(failed.device, 'Safari');
  assert.ok(events.body.stats.failed24h >= 1);
  assert.ok(events.body.stats.online >= 1);
  assert.equal((await call('GET', '/admin/login-events?q=nobody-here', null, admin)).body.total, 0);

  const users = await call('GET', '/admin/users', null, admin);
  const demo = users.body.users.find((u) => u.id === 'u-demo');
  assert.equal(demo.passwordHash, undefined);
  assert.ok(demo.orders >= 1);

  // Blocking ends the session and stops new logins.
  token = ok.body.token;
  assert.equal((await call('PATCH', '/admin/users/u-demo', { blocked: true }, admin)).body.blocked, true);
  assert.equal((await call('GET', '/me')).status, 403);
  token = null;
  assert.equal((await call('POST', '/auth/login', { phone: '03001234567', password: 'password' })).status, 403);
  assert.equal((await call('GET', '/admin/users?blocked=true', null, admin)).body.users.length, 1);
  await call('PATCH', '/admin/users/u-demo', { blocked: false }, admin);
  assert.equal((await call('PATCH', '/admin/users/u-demo', { blocked: 'yes' }, admin)).status, 400);

  const detail = await call('GET', '/admin/users/u-demo', null, admin);
  assert.ok(detail.body.logins.length >= 2);

  const dash = await call('GET', '/admin/dashboard?range=7d', null, admin);
  assert.equal(dash.body.sales.series.length, 7);
  assert.ok(dash.body.stats.sales.value > 0);
  assert.ok(dash.body.recentOrders[0].number.startsWith('TR-'));
  assert.ok(dash.body.topCategories.length > 0);
  assert.equal((await call('GET', '/admin/dashboard?range=12m', null, admin)).body.sales.series.length, 12);
  assert.equal((await call('GET', '/admin/dashboard?range=30d', null, admin)).body.sales.series.length, 30);
});
