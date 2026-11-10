// Pure business logic shared by all routes. No I/O here, so it is easy to test
// and is mirrored 1:1 by the Flutter app's offline demo repository
// (app/lib/data/local_repository.dart).

const ORDER_STEPS = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
const CHANNELS = ['app', 'web'];
const DAY = 24 * 60 * 60 * 1000;

function discountPercent(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0;
  return Math.round((1 - p.price / p.oldPrice) * 100);
}

/** Admin discount campaign state: draft | scheduled | live | ending (< 3 days left) | ended. */
function discountStatus(d, now = new Date()) {
  if (d.draft) return 'draft';
  const t = new Date(now).getTime();
  const starts = d.startsAt ? Date.parse(d.startsAt) : -Infinity;
  const ends = d.endsAt ? Date.parse(d.endsAt) : Infinity;
  if (t < starts) return 'scheduled';
  if (t >= ends) return 'ended';
  return ends - t < 3 * DAY ? 'ending' : 'live';
}

const discountRunning = (d, now) => ['live', 'ending'].includes(discountStatus(d, now));

/**
 * Price a customer pays. A product's own sale (oldPrice) wins; otherwise the biggest running
 * campaign or category discount applies, shown as price + struck-through oldPrice.
 */
function effectivePricing(db, p, now = new Date()) {
  if (p.oldPrice && p.oldPrice > p.price) return { price: p.price, oldPrice: p.oldPrice, source: 'product' };
  let off = 0;
  let source = null;
  const cat = db.categories.find((c) => c.id === p.categoryId);
  if (cat && cat.discountPercent > 0) {
    off = Math.round((p.price * cat.discountPercent) / 100);
    source = 'category';
  }
  for (const d of db.discounts || []) {
    if (!discountRunning(d, now)) continue;
    if (d.scope === 'categories' && !d.targetIds.includes(p.categoryId)) continue;
    if (d.scope === 'products' && !d.targetIds.includes(p.id)) continue;
    const value = d.type === 'percent' ? Math.round((p.price * d.value) / 100) : d.value;
    if (value > off && value < p.price) {
      off = value;
      source = d.id;
    }
  }
  return off > 0 ? { price: p.price - off, oldPrice: p.price, source } : { price: p.price, oldPrice: p.oldPrice || null, source: null };
}

/** Fields older records may lack. */
function withDefaults(p) {
  return { status: 'published', channels: CHANNELS, ...p };
}

/** Product as customers see it. Without `db` only the product's own sale is applied. */
function withComputed(p, db, now) {
  const base = withDefaults(p);
  if (!db) return { ...base, discount: discountPercent(p) };
  const e = effectivePricing(db, p, now);
  return { ...base, price: e.price, oldPrice: e.oldPrice, discount: discountPercent(e) };
}

/** Published and (optionally) enabled for one channel: 'app' | 'web'. */
function isListed(p, channel) {
  const { status, channels } = withDefaults(p);
  return status === 'published' && (!channel || channels.includes(channel));
}

function normalize(s) {
  return String(s || '').toLowerCase().trim();
}

function matchesQuery(p, category, q) {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [p.name, p.fullName, p.label, category && category.name, ...(p.tags || [])]
    .map(normalize)
    .join(' ');
  return words.every((w) => hay.includes(w) || (w.endsWith('s') && hay.includes(w.slice(0, -1))));
}

/**
 * Filter + sort products.
 * opts: { categoryId, q, tag, section ('hot'|'new'), minPrice, maxPrice, minRating,
 *         onSale, freeDelivery, inStock, categories: [ids], sort }
 * sort: popular | relevance | price_asc | price_desc | rating | newest
 */
function queryProducts(db, opts = {}) {
  const catById = Object.fromEntries(db.categories.map((c) => [c.id, c]));
  const cats = opts.categories && opts.categories.length ? new Set(opts.categories) : null;
  const now = new Date();
  let list = db.products.filter((p) => isListed(p, opts.channel)).map((p) => withComputed(p, db, now)).filter((p) => {
    if (opts.categoryId && p.categoryId !== opts.categoryId) return false;
    if (cats && !cats.has(p.categoryId)) return false;
    if (opts.tag && opts.tag !== 'All' && !(p.tags || []).includes(opts.tag)) return false;
    if (opts.section === 'hot' && !p.hot) return false;
    if (opts.section === 'new' && !p.isNew) return false;
    if (opts.minPrice != null && p.price < Number(opts.minPrice)) return false;
    if (opts.maxPrice != null && p.price > Number(opts.maxPrice)) return false;
    if (opts.minRating != null && p.rating < Number(opts.minRating)) return false;
    if (truthy(opts.onSale) && !discountPercent(p)) return false;
    if (truthy(opts.freeDelivery) && !p.freeDelivery) return false;
    if (truthy(opts.inStock) && !p.inStock) return false;
    if (opts.q && !matchesQuery(p, catById[p.categoryId], opts.q)) return false;
    return true;
  });
  const sorters = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
    newest: (a, b) => Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity,
    popular: (a, b) => b.popularity - a.popularity,
    relevance: (a, b) => b.popularity - a.popularity,
  };
  return list.sort(sorters[opts.sort] || sorters.popular);
}

function truthy(v) {
  return v === true || v === 'true' || v === '1' || v === 1;
}

/** `all` counts drafts too (admin); otherwise only what customers can see. */
function categoriesWithCounts(db, { all = false } = {}) {
  return db.categories.map((c) => ({
    ...c,
    itemCount: db.products.filter((p) => p.categoryId === c.id && (all || isListed(p))).length,
    filters: (db.categoryFilters && db.categoryFilters[c.id]) || [],
  }));
}

/** Autocomplete suggestions: distinct phrases that start with the query. */
function suggestions(db, q, limit = 4) {
  const query = normalize(q);
  if (!query) return { phrases: [], products: [] };
  const pool = new Set();
  for (const p of db.products) {
    const cat = db.categories.find((c) => c.id === p.categoryId);
    const base = normalize(cat ? cat.name.split(' ').pop() : p.label);
    pool.add(base);
    for (const t of p.tags || []) pool.add(`${base} ${normalize(t)}`);
    pool.add(normalize(p.name));
  }
  for (const t of db.trending) pool.add(normalize(t));
  const phrases = [...pool].filter((s) => s.startsWith(query) || s.split(' ').some((w) => w.startsWith(query)));
  phrases.sort((a, b) => Number(!a.startsWith(query)) - Number(!b.startsWith(query)) || a.length - b.length);
  const products = queryProducts(db, { sort: 'popular' })
    .filter((p) => matchesPrefix(p, db, query))
    .slice(0, 2);
  return { phrases: phrases.slice(0, limit), products };
}

function matchesPrefix(p, db, query) {
  const cat = db.categories.find((c) => c.id === p.categoryId);
  const words = [p.name, p.label, cat && cat.name, ...(p.tags || [])].map(normalize).join(' ').split(/\s+/);
  return query.split(/\s+/).every((q) => words.some((w) => w.startsWith(q)));
}

function validatePromo(db, code, subtotal, now = new Date()) {
  const promo = db.promos.find((p) => p.code.toUpperCase() === normalize(code).toUpperCase());
  if (!promo || promo.active === false) return { valid: false, message: 'Invalid promo code' };
  if (promo.expiresAt && Date.parse(promo.expiresAt) <= new Date(now).getTime()) return { valid: false, message: 'This code has expired' };
  if (promo.maxUses && (promo.used || 0) >= promo.maxUses) return { valid: false, message: 'This code has been fully used' };
  if (subtotal < (promo.minSubtotal || 0)) {
    return { valid: false, message: `Minimum order Rs ${promo.minSubtotal} for this code` };
  }
  let discount = promo.type === 'percent' ? Math.round((subtotal * promo.amount) / 100) : promo.amount;
  if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  return { valid: true, code: promo.code, discount: Math.min(discount, subtotal), description: promo.description };
}

/** Expand raw cart lines with product data and compute totals. */
function cartSummary(db, lines, { promoCode, deliveryMethodId } = {}) {
  const items = lines
    .map((l) => {
      const raw = db.products.find((x) => x.id === l.productId);
      if (!raw || !isListed(raw)) return null;
      const p = withComputed(raw, db);
      return { ...l, product: p, lineTotal: p.price * l.qty };
    })
    .filter(Boolean);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const method = db.deliveryMethods.find((m) => m.id === (deliveryMethodId || 'standard')) || db.deliveryMethods[0];
  const deliveryFee = items.length ? method.fee : 0;
  const promo = promoCode ? validatePromo(db, promoCode, subtotal) : null;
  const discount = promo && promo.valid ? promo.discount : 0;
  return {
    items,
    itemCount: items.reduce((s, i) => s + i.qty, 0),
    subtotal,
    deliveryFee,
    deliveryMethodId: method.id,
    promoCode: promo && promo.valid ? promo.code : null,
    promoError: promo && !promo.valid ? promo.message : null,
    discount,
    total: Math.max(0, subtotal + deliveryFee - discount),
  };
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function nextOrderNumber(db) {
  const nums = db.orders.map((o) => Number(String(o.number).replace(/\D/g, ''))).filter(Boolean);
  return `TR-${nums.length ? Math.max(...nums) + 1 : 20481}`;
}

function buildOrder(db, { userId, lines, addressId, deliveryMethodId, paymentMethodId, promoCode, now = new Date() }) {
  const summary = cartSummary(db, lines, { promoCode, deliveryMethodId });
  if (!summary.items.length) throw httpError(400, 'Cart is empty');
  const address = db.addresses.find((a) => a.id === addressId && a.userId === userId);
  if (!address) throw httpError(400, 'Select a delivery address');
  const payment = db.paymentMethods.find((m) => m.id === paymentMethodId);
  if (!payment) throw httpError(400, 'Select a payment method');
  const method = db.deliveryMethods.find((m) => m.id === summary.deliveryMethodId);
  const created = new Date(now);
  return {
    id: `o-${created.getTime()}`,
    number: nextOrderNumber(db),
    userId,
    createdAt: created.toISOString(),
    items: summary.items.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      icon: i.product.icon,
      imageUrl: i.product.imageUrl,
      variant: i.variant,
      qty: i.qty,
      price: i.product.price,
      oldPrice: i.product.oldPrice,
      categoryId: i.product.categoryId,
    })),
    itemCount: summary.itemCount,
    subtotal: summary.subtotal,
    deliveryFee: summary.deliveryFee,
    discount: summary.discount,
    promoCode: summary.promoCode,
    total: summary.total,
    address,
    deliveryMethod: method,
    payment: { id: payment.id, name: payment.name },
    courier: 'Tahrio Express',
    etaFrom: addDays(created, method.minDays).toISOString(),
    etaTo: addDays(created, method.maxDays).toISOString(),
    status: 'packed',
    timeline: [
      { step: 'placed', at: created.toISOString() },
      { step: 'confirmed', at: created.toISOString() },
    ],
  };
}

function advanceOrder(order, now = new Date()) {
  const idx = ORDER_STEPS.indexOf(order.status);
  if (idx < 0 || idx >= ORDER_STEPS.length - 1) return order;
  return {
    ...order,
    status: ORDER_STEPS[idx + 1],
    timeline: [...order.timeline, { step: order.status, at: new Date(now).toISOString() }],
  };
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/** Reviews for one product, newest first. */
function productReviews(db, productId) {
  return (db.reviews || [])
    .filter((r) => r.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Validates and whitelists admin product input. Rating, review count and sales are never taken
 * from input (they come from real reviews/orders). `partial` = PATCH (only given fields).
 */
function productInput(body, { partial = false, categoryIds = [] } = {}) {
  const b = body || {};
  const out = {};
  const has = (k) => b[k] !== undefined;
  const str = (k, { required = false, max = 200, nullable = false } = {}) => {
    if (!has(k)) {
      if (required && !partial) throw httpError(400, `${k} is required`);
      return;
    }
    if (b[k] === null || b[k] === '') {
      if (nullable) return void (out[k] = null);
      if (required) throw httpError(400, `${k} is required`);
      return void (out[k] = '');
    }
    const v = String(b[k]).trim();
    if (v.length > max) throw httpError(400, `${k} must be at most ${max} characters`);
    out[k] = v;
  };
  const num = (k, { required = false, nullable = false } = {}) => {
    if (!has(k)) {
      if (required && !partial) throw httpError(400, `${k} is required`);
      return;
    }
    if ((b[k] === null || b[k] === '') && nullable) return void (out[k] = null);
    const v = Number(b[k]);
    if (!Number.isFinite(v) || v < 0) throw httpError(400, `${k} must be a positive number`);
    out[k] = Math.round(v);
  };
  const bool = (k) => {
    if (has(k)) out[k] = truthy(b[k]);
  };

  str('name', { required: true, max: 60 });
  str('fullName', { max: 140 });
  str('categoryId', { required: true, max: 60 });
  str('label', { max: 80 });
  str('icon', { max: 40 });
  str('imageUrl', { max: 500, nullable: true });
  str('videoUrl', { max: 500, nullable: true });
  str('description', { max: 4000 });
  str('variantLabel', { max: 40 });
  num('price', { required: true });
  num('oldPrice', { nullable: true });
  num('popularity');
  str('brand', { max: 60 });
  str('sku', { max: 40 });
  num('stock', { nullable: true });
  num('lowStockAt', { nullable: true });
  ['freeDelivery', 'inStock', 'hot', 'isNew', 'inSaleBanner', 'codAvailable', 'videoFirst', 'videoAutoplay'].forEach(bool);
  const oneOf = (k, values, { nullable = false } = {}) => {
    if (!has(k)) return;
    if (b[k] === null && nullable) return void (out[k] = null);
    if (!values.includes(b[k])) throw httpError(400, `${k} must be one of ${values.join(', ')}`);
    out[k] = b[k];
  };
  oneOf('status', ['draft', 'published']);
  oneOf('discountType', ['percent', 'flat'], { nullable: true });
  const strList = (k, maxItems, maxLen) => {
    if (!has(k)) return;
    if (!Array.isArray(b[k])) throw httpError(400, `${k} must be a list`);
    const list = b[k].map((x) => String(x).trim()).filter(Boolean);
    if (list.length > maxItems) throw httpError(400, `${k} allows at most ${maxItems} items`);
    if (list.some((x) => x.length > maxLen)) throw httpError(400, `Each ${k} item must be at most ${maxLen} characters`);
    out[k] = list;
  };
  strList('highlights', 12, 120);
  strList('images', 8, 500);
  if (has('channels')) {
    if (!Array.isArray(b.channels) || b.channels.some((c) => !CHANNELS.includes(c))) throw httpError(400, 'channels must be a list of app / web');
    out.channels = CHANNELS.filter((c) => b.channels.includes(c));
  }
  if (has('specs')) {
    if (!Array.isArray(b.specs)) throw httpError(400, 'specs must be a list');
    out.specs = b.specs
      .map((s) => ({ key: String((s && s.key) || '').trim(), value: String((s && s.value) || '').trim() }))
      .filter((s) => s.key || s.value);
    if (out.specs.length > 20) throw httpError(400, 'specs allows at most 20 rows');
    if (out.specs.some((s) => !s.key || !s.value || s.key.length > 40 || s.value.length > 120)) {
      throw httpError(400, 'Each specification needs a name (max 40) and a value (max 120)');
    }
  }
  if (out.images) out.imageUrl = out.images[0] || null;
  if (out.stock != null && !has('inStock')) out.inStock = out.stock > 0;

  if (has('tags')) {
    if (!Array.isArray(b.tags)) throw httpError(400, 'tags must be a list');
    out.tags = [...new Set(b.tags.map((t) => String(t).trim()).filter(Boolean))].slice(0, 20);
  }
  if (has('colors')) {
    if (!Array.isArray(b.colors)) throw httpError(400, 'colors must be a list');
    out.colors = b.colors.slice(0, 12).map((c) => {
      const name = String((c && c.name) || '').trim();
      const hex = String((c && c.hex) || '').trim();
      if (!name || !/^#[0-9a-f]{6}$/i.test(hex)) throw httpError(400, 'Each colour needs a name and a #RRGGBB hex');
      return { name, hex };
    });
  }

  if (out.price === 0) throw httpError(400, 'price must be more than 0');
  if (out.categoryId !== undefined && !categoryIds.includes(out.categoryId)) throw httpError(400, 'Unknown category');
  for (const k of ['imageUrl', 'videoUrl']) {
    if (out[k] && !/^(https?:\/\/|assets\/)/.test(out[k])) throw httpError(400, `${k} must be an http(s) URL`);
  }
  if (out.images && out.images.some((u) => !/^(https?:\/\/|assets\/)/.test(u))) throw httpError(400, 'images must be http(s) URLs');
  return out;
}

module.exports = {
  CHANNELS,
  DAY,
  discountStatus,
  effectivePricing,
  isListed,
  withDefaults,
  productInput,
  productReviews,
  ORDER_STEPS,
  discountPercent,
  queryProducts,
  categoriesWithCounts,
  suggestions,
  validatePromo,
  cartSummary,
  buildOrder,
  advanceOrder,
  httpError,
  withComputed,
};
