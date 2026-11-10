const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const store = require('./db');
const L = require('./logic');
const A = require('./admin-logic');
const adminRoutes = require('./admin-routes');

const JWT_SECRET = process.env.JWT_SECRET || 'tahrio-dev-secret-change-me';
// Trimmed: a pasted key often carries a trailing space/newline, which HTTP strips from the header.
const ADMIN_KEY = (process.env.ADMIN_KEY || 'tahrio-admin').trim();
/** Public origin of this API (e.g. https://api.tahrio.pk), used for uploaded image URLs. */
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const UPLOAD_DIR = path.join(store.DATA_DIR, 'uploads');
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const VIDEO_TYPES = { 'video/mp4': 'mp4', 'video/quicktime': 'mov' };
const ONLINE_PING_MS = 60 * 1000;

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
// Product photos uploaded from the admin panel; file names are unique, so cache forever.
app.use('/uploads', express.static(UPLOAD_DIR, {
  immutable: true,
  maxAge: '365d',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// ---------- helpers ----------
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function publicUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

function issueToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
}

function normalizePhone(phone) {
  // Accept "+92 300 1234567", "0300-1234567", "03001234567" -> "03001234567"
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('92')) d = '0' + d.slice(2);
  if (!d.startsWith('0')) d = '0' + d;
  return d;
}

function auth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw L.httpError(401, 'Sign in required');
  let user;
  try {
    const { sub } = jwt.verify(token, JWT_SECRET);
    user = store.get().users.find((u) => u.id === sub);
    if (!user) throw new Error('unknown user');
  } catch {
    throw L.httpError(401, 'Session expired, please sign in again');
  }
  if (user.blocked) throw L.httpError(403, 'This account has been blocked');
  // "Online now" in the admin panel: last authenticated request, saved at most once a minute.
  if (!user.lastSeenAt || Date.now() - Date.parse(user.lastSeenAt) > ONLINE_PING_MS) {
    user.lastSeenAt = new Date().toISOString();
    store.save();
  }
  req.user = user;
  next();
}

/** Appends to the login log shown in the admin panel (Users & Login Activity). Caller saves. */
function recordLogin(req, { user = null, method, result, reason = null, phone = null, email = null }) {
  const db = store.get();
  const events = (db.loginEvents = db.loginEvents || []);
  events.push({
    id: `le-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId: user ? user.id : null,
    name: user ? user.name : null,
    phone: (user && user.phone) || phone,
    email: (user && user.email) || email,
    method,
    result,
    reason,
    ...A.clientInfo(req.headers),
    ip: req.ip,
    createdAt: new Date().toISOString(),
  });
  if (events.length > 5000) events.splice(0, events.length - 5000);
  if (user && result !== 'failed') user.lastSeenAt = new Date().toISOString();
}

function adminOnly(req, _res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) throw L.httpError(403, 'Admin key required');
  next();
}

const cartOf = (db, uid) => (db.carts[uid] = db.carts[uid] || []);
const wishlistOf = (db, uid) => (db.wishlists[uid] = db.wishlists[uid] || []);
const recentOf = (db, uid) => (db.recentSearches[uid] = db.recentSearches[uid] || []);

// ---------- health ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'tahrio-api', time: new Date().toISOString() }));

// ---------- auth ----------
app.post('/api/auth/login', wrap(async (req, res) => {
  const db = store.get();
  const phone = normalizePhone(req.body.phone);
  const user = db.users.find((u) => u.phone === phone && !u.isGuest);
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
    recordLogin(req, { user, phone, method: 'password', result: 'failed', reason: user ? 'wrong password' : 'unknown number' });
    store.save();
    throw L.httpError(401, 'Incorrect phone number or password');
  }
  if (user.blocked) {
    recordLogin(req, { user, method: 'password', result: 'failed', reason: 'blocked' });
    store.save();
    throw L.httpError(403, 'This account has been blocked');
  }
  recordLogin(req, { user, method: 'password', result: 'success' });
  store.save();
  res.json({ token: issueToken(user), user: publicUser(user) });
}));

app.post('/api/auth/register', wrap(async (req, res) => {
  const db = store.get();
  const { name, password } = req.body;
  const phone = normalizePhone(req.body.phone);
  if (!name || !/^03\d{9}$/.test(phone)) throw L.httpError(400, 'Enter your name and a valid 03XX-XXXXXXX phone number');
  if (!password || String(password).length < 6) throw L.httpError(400, 'Password must be at least 6 characters');
  if (db.users.some((u) => u.phone === phone)) throw L.httpError(409, 'An account with this phone already exists');
  const user = { id: `u-${Date.now()}`, name, phone, isGuest: false, createdAt: new Date().toISOString(), passwordHash: await bcrypt.hash(password, 10) };
  db.users.push(user);
  recordLogin(req, { user, method: 'password', result: 'signup' });
  store.save();
  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
}));

app.post('/api/auth/guest', wrap(async (req, res) => {
  const db = store.get();
  const user = { id: `g-${Date.now()}`, name: 'Guest', phone: null, isGuest: true, createdAt: new Date().toISOString(), passwordHash: '' };
  db.users.push(user);
  recordLogin(req, { user, method: 'guest', result: 'guest' });
  store.save();
  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
}));

// Google sign-in: the app sends the Google profile; production should verify the ID token.
app.post('/api/auth/google', wrap(async (req, res) => {
  const db = store.get();
  const { email, name } = req.body;
  if (!email) throw L.httpError(400, 'Google account email missing');
  let user = db.users.find((u) => u.email === email);
  let result = 'success';
  if (!user) {
    user = { id: `u-${Date.now()}`, name: name || email.split('@')[0], email, phone: null, isGuest: false, createdAt: new Date().toISOString(), passwordHash: '' };
    db.users.push(user);
    result = 'signup';
  }
  if (user.blocked) {
    recordLogin(req, { user, method: 'google', result: 'failed', reason: 'blocked' });
    store.save();
    throw L.httpError(403, 'This account has been blocked');
  }
  recordLogin(req, { user, method: 'google', result });
  store.save();
  res.json({ token: issueToken(user), user: publicUser(user) });
}));

app.get('/api/me', auth, (req, res) => res.json(publicUser(req.user)));

// ---------- catalog ----------
app.get('/api/categories', (_req, res) => res.json(L.categoriesWithCounts(store.get())));

app.get('/api/banners', (req, res) => {
  const db = store.get();
  const now = new Date();
  // Banners created by an admin discount only show while that discount runs.
  const running = (b) => {
    const d = b.discountId && (db.discounts || []).find((x) => x.id === b.discountId);
    return !b.discountId || (d && ['live', 'ending'].includes(L.discountStatus(d, now)));
  };
  res.json(db.banners.filter((b) => (!req.query.placement || b.placement === req.query.placement) && running(b)));
});

app.get('/api/products', (req, res) => {
  const q = req.query;
  const items = L.queryProducts(store.get(), {
    ...q,
    categories: q.categories ? String(q.categories).split(',') : undefined,
  });
  res.json({ total: items.length, items });
});

app.get('/api/products/:id', (req, res) => {
  const db = store.get();
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p || !L.isListed(p)) throw L.httpError(404, 'Product not found');
  res.json(L.withComputed(p, db));
});
app.get('/api/products/:id/reviews', (req, res) => {
  const db = store.get();
  if (!db.products.some((x) => x.id === req.params.id && L.isListed(x))) throw L.httpError(404, 'Product not found');
  res.json(L.productReviews(db, req.params.id));
});

// ---------- search ----------
app.get('/api/search/suggestions', (req, res) => res.json(L.suggestions(store.get(), req.query.q)));
app.get('/api/search/trending', (_req, res) => res.json(store.get().trending));

app.get('/api/search/recent', auth, (req, res) => res.json(recentOf(store.get(), req.user.id)));
app.post('/api/search/recent', auth, (req, res) => {
  const db = store.get();
  const term = String(req.body.term || '').trim();
  if (term) {
    const list = recentOf(db, req.user.id).filter((t) => t.toLowerCase() !== term.toLowerCase());
    db.recentSearches[req.user.id] = [term, ...list].slice(0, 10);
    store.save();
  }
  res.json(recentOf(db, req.user.id));
});
app.delete('/api/search/recent', auth, (req, res) => {
  const db = store.get();
  db.recentSearches[req.user.id] = req.query.term
    ? recentOf(db, req.user.id).filter((t) => t !== req.query.term)
    : [];
  store.save();
  res.json(db.recentSearches[req.user.id]);
});

// ---------- wishlist ----------
app.get('/api/wishlist', auth, (req, res) => {
  const db = store.get();
  const ids = wishlistOf(db, req.user.id);
  res.json(
    ids
      .map((id) => db.products.find((p) => p.id === id))
      .filter((p) => p && L.isListed(p))
      .map((p) => L.withComputed(p, db)),
  );
});
app.put('/api/wishlist/:productId', auth, (req, res) => {
  const db = store.get();
  if (!db.products.some((p) => p.id === req.params.productId)) throw L.httpError(404, 'Product not found');
  const list = wishlistOf(db, req.user.id);
  if (!list.includes(req.params.productId)) list.unshift(req.params.productId);
  store.save();
  res.json({ ids: list });
});
app.delete('/api/wishlist/:productId', auth, (req, res) => {
  const db = store.get();
  db.wishlists[req.user.id] = wishlistOf(db, req.user.id).filter((id) => id !== req.params.productId);
  store.save();
  res.json({ ids: db.wishlists[req.user.id] });
});

// ---------- cart ----------
function cartResponse(req) {
  const db = store.get();
  return L.cartSummary(db, cartOf(db, req.user.id), {
    promoCode: req.query.promo,
    deliveryMethodId: req.query.delivery,
  });
}
app.get('/api/cart', auth, (req, res) => res.json(cartResponse(req)));
app.post('/api/cart/items', auth, (req, res) => {
  const db = store.get();
  const { productId, variant = null } = req.body;
  const qty = Math.max(1, Number(req.body.qty) || 1);
  const p = db.products.find((x) => x.id === productId);
  if (!p || !L.isListed(p)) throw L.httpError(404, 'Product not found');
  if (!p.inStock) throw L.httpError(400, 'This item is out of stock');
  const cart = cartOf(db, req.user.id);
  const line = cart.find((l) => l.productId === productId && (l.variant || null) === variant);
  if (line) line.qty += qty;
  else cart.push({ productId, qty, variant });
  store.save();
  res.status(201).json(cartResponse(req));
});
app.patch('/api/cart/items', auth, (req, res) => {
  const db = store.get();
  const { productId, variant = null } = req.body;
  const qty = Number(req.body.qty);
  const cart = cartOf(db, req.user.id);
  const line = cart.find((l) => l.productId === productId && (l.variant || null) === variant);
  if (!line) throw L.httpError(404, 'Item not in cart');
  if (qty <= 0) db.carts[req.user.id] = cart.filter((l) => l !== line);
  else line.qty = qty;
  store.save();
  res.json(cartResponse(req));
});
app.delete('/api/cart', auth, (req, res) => {
  store.get().carts[req.user.id] = [];
  store.save();
  res.json(cartResponse(req));
});

app.post('/api/promo/validate', auth, (req, res) => {
  const db = store.get();
  const { subtotal } = L.cartSummary(db, cartOf(db, req.user.id));
  res.json(L.validatePromo(db, req.body.code, subtotal));
});

// ---------- checkout config ----------
app.get('/api/checkout/options', (_req, res) => {
  const db = store.get();
  res.json({ deliveryMethods: db.deliveryMethods, paymentMethods: db.paymentMethods });
});

// ---------- addresses ----------
app.get('/api/addresses', auth, (req, res) => res.json(store.get().addresses.filter((a) => a.userId === req.user.id)));
app.post('/api/addresses', auth, (req, res) => {
  const db = store.get();
  const { label, name, phone, line } = req.body;
  if (!label || !name || !phone || !line) throw L.httpError(400, 'Label, name, phone and address are required');
  const mine = db.addresses.filter((a) => a.userId === req.user.id);
  const makeDefault = Boolean(req.body.isDefault) || mine.length === 0;
  if (makeDefault) mine.forEach((a) => (a.isDefault = false));
  const address = { id: `a-${Date.now()}`, userId: req.user.id, label, name, phone, line, isDefault: makeDefault };
  db.addresses.push(address);
  store.save();
  res.status(201).json(address);
});
app.delete('/api/addresses/:id', auth, (req, res) => {
  const db = store.get();
  db.addresses = db.addresses.filter((a) => !(a.id === req.params.id && a.userId === req.user.id));
  store.save();
  res.status(204).end();
});

// ---------- orders ----------
app.post('/api/orders', auth, (req, res) => {
  const db = store.get();
  const order = L.buildOrder(db, {
    userId: req.user.id,
    lines: cartOf(db, req.user.id),
    addressId: req.body.addressId,
    deliveryMethodId: req.body.deliveryMethodId,
    paymentMethodId: req.body.paymentMethodId,
    promoCode: req.body.promoCode,
  });
  db.orders.push(order);
  db.carts[req.user.id] = [];
  const promo = order.promoCode && db.promos.find((x) => x.code === order.promoCode);
  if (promo) promo.used = (promo.used || 0) + 1;
  store.save();
  res.status(201).json(order);
});
app.get('/api/orders', auth, (req, res) => {
  res.json(store.get().orders.filter((o) => o.userId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});
app.get('/api/orders/:id', auth, (req, res) => {
  const o = store.get().orders.find((x) => (x.id === req.params.id || x.number === req.params.id) && x.userId === req.user.id);
  if (!o) throw L.httpError(404, 'Order not found');
  res.json(o);
});

// ---------- admin ----------
app.get('/api/admin/orders', adminOnly, (_req, res) => res.json(store.get().orders));
app.post('/api/admin/orders/:id/advance', adminOnly, (req, res) => {
  const db = store.get();
  const i = db.orders.findIndex((o) => o.id === req.params.id || o.number === req.params.id);
  if (i < 0) throw L.httpError(404, 'Order not found');
  db.orders[i] = L.advanceOrder(db.orders[i]);
  store.save();
  res.json(db.orders[i]);
});
const categoryIds = (db) => db.categories.map((c) => c.id);

/** Stored product (what the edit form needs) + what customers pay right now. */
function adminProduct(db, p) {
  const effective = L.effectivePricing(db, p);
  return { ...L.withDefaults(p), discount: L.discountPercent(p), effective: { ...effective, discount: L.discountPercent(effective) } };
}

app.get('/api/admin/products', adminOnly, (_req, res) => {
  const db = store.get();
  res.json(db.products.slice().reverse().map((p) => adminProduct(db, p)));
});
app.get('/api/admin/products/:id', adminOnly, (req, res) => {
  const db = store.get();
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) throw L.httpError(404, 'Product not found');
  res.json(adminProduct(db, p));
});
app.post('/api/admin/products', adminOnly, (req, res) => {
  const db = store.get();
  const input = L.productInput(req.body, { categoryIds: categoryIds(db) });
  const p = {
    id: `p-${Date.now()}`,
    fullName: input.name,
    label: '',
    tags: [],
    icon: db.categories.find((c) => c.id === input.categoryId).icon,
    imageUrl: null,
    videoUrl: null,
    price: 0,
    oldPrice: null,
    rating: 0,
    reviews: 0,
    sold: 0,
    freeDelivery: false,
    inStock: true,
    hot: false,
    isNew: true,
    popularity: 0,
    colors: [],
    description: '',
    brand: '',
    sku: '',
    stock: null,
    lowStockAt: 10,
    highlights: [],
    specs: [],
    images: [],
    status: 'published',
    channels: L.CHANNELS,
    codAvailable: true,
    inSaleBanner: false,
    videoFirst: false,
    videoAutoplay: false,
    discountType: null,
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.products.push(p);
  store.save();
  res.status(201).json(adminProduct(db, p));
});
app.patch('/api/admin/products/:id', adminOnly, (req, res) => {
  const db = store.get();
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) throw L.httpError(404, 'Product not found');
  Object.assign(p, L.productInput(req.body, { partial: true, categoryIds: categoryIds(db) }), { updatedAt: new Date().toISOString() });
  store.save();
  res.json(adminProduct(db, p));
});
app.delete('/api/admin/products/:id', adminOnly, (req, res) => {
  const db = store.get();
  const id = req.params.id;
  if (!db.products.some((p) => p.id === id)) throw L.httpError(404, 'Product not found');
  // Past orders keep their own line snapshots; live carts and wishlists drop the product.
  db.products = db.products.filter((p) => p.id !== id);
  for (const uid of Object.keys(db.carts)) db.carts[uid] = db.carts[uid].filter((l) => l.productId !== id);
  for (const uid of Object.keys(db.wishlists)) db.wishlists[uid] = db.wishlists[uid].filter((pid) => pid !== id);
  store.save();
  res.status(204).end();
});
// Raw body: image/jpeg|png|webp up to 5 MB, or video/mp4|quicktime up to 50 MB → { url }.
const UPLOAD_TYPES = { ...IMAGE_TYPES, ...VIDEO_TYPES };
app.post('/api/admin/uploads', adminOnly, express.raw({ type: Object.keys(UPLOAD_TYPES), limit: '50mb' }), (req, res) => {
  const type = req.headers['content-type'];
  const ext = UPLOAD_TYPES[type];
  const buf = req.body;
  if (!ext || !Buffer.isBuffer(buf) || !buf.length) throw L.httpError(400, 'Send a JPEG, PNG or WebP image, or an MP4 / MOV video');
  if (IMAGE_TYPES[type] && buf.length > 5 * 1024 * 1024) throw L.httpError(413, 'Images must be 5 MB or smaller');
  const magic = {
    jpg: buf[0] === 0xff && buf[1] === 0xd8,
    png: buf.subarray(0, 4).toString('hex') === '89504e47',
    webp: buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP',
    mp4: buf.subarray(4, 8).toString() === 'ftyp',
    mov: buf.subarray(4, 8).toString() === 'ftyp',
  };
  if (!magic[ext]) throw L.httpError(400, `File is not a valid ${VIDEO_TYPES[type] ? 'video' : 'image'}`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  const origin = PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ url: `${origin}/uploads/${name}` });
});
app.post('/api/admin/reset', adminOnly, (_req, res) => {
  store.reset();
  res.json({ ok: true });
});
// Dashboard, categories, discounts, coupons, users and login activity.
app.use('/api/admin', adminOnly, adminRoutes);

// ---------- errors ----------
app.use((req, _res, next) => next(L.httpError(404, `No route ${req.method} ${req.path}`)));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Server error' });
});

module.exports = app;
