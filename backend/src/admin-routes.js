// Admin panel endpoints (mounted under /api/admin behind the admin key in app.js).
const express = require('express');
const store = require('./db');
const L = require('./logic');
const A = require('./admin-logic');

const router = express.Router();

// ---------- dashboard ----------
router.get('/dashboard', (req, res) => {
  const range = ['7d', '30d', '12m'].includes(req.query.range) ? req.query.range : '7d';
  res.json(A.dashboard(store.get(), { range }));
});

// ---------- categories ----------
const sortedCategories = (db) => L.categoriesWithCounts(db, { all: true });

router.get('/categories', (_req, res) => res.json(sortedCategories(store.get())));

router.post('/categories', (req, res) => {
  const db = store.get();
  const input = A.categoryInput(req.body, { categories: db.categories });
  const c = {
    id: A.uniqueId(input.name, db.categories.map((x) => x.id), 'category'),
    shortName: input.name,
    icon: 'case',
    imageUrl: null,
    parentId: null,
    discountPercent: 0,
    showOnHome: true,
    showInSaleBanner: false,
    ...input,
  };
  c.badge = A.categoryBadge(c);
  db.categories.push(c);
  store.save();
  res.status(201).json(c);
});

// Order shown in the apps: { ids: [...] } with every category id exactly once.
router.post('/categories/reorder', (req, res) => {
  const db = store.get();
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
  const current = db.categories.map((c) => c.id);
  if (ids.length !== current.length || new Set(ids).size !== ids.length || ids.some((id) => !current.includes(id))) {
    throw L.httpError(400, 'Send every category id once');
  }
  db.categories = ids.map((id) => db.categories.find((c) => c.id === id));
  store.save();
  res.json(sortedCategories(db));
});

router.patch('/categories/:id', (req, res) => {
  const db = store.get();
  const c = db.categories.find((x) => x.id === req.params.id);
  if (!c) throw L.httpError(404, 'Category not found');
  Object.assign(c, A.categoryInput(req.body, { partial: true, categories: db.categories, selfId: c.id }));
  c.badge = A.categoryBadge(c);
  store.save();
  res.json(c);
});

router.delete('/categories/:id', (req, res) => {
  const db = store.get();
  const id = req.params.id;
  if (!db.categories.some((c) => c.id === id)) throw L.httpError(404, 'Category not found');
  const used = db.products.filter((p) => p.categoryId === id).length;
  if (used) throw L.httpError(409, `Move or delete its ${used} product${used === 1 ? '' : 's'} first`);
  if (db.categories.some((c) => c.parentId === id)) throw L.httpError(409, 'Move its sub-categories first');
  db.categories = db.categories.filter((c) => c.id !== id);
  for (const d of db.discounts || []) d.targetIds = d.targetIds.filter((t) => t !== id);
  store.save();
  res.status(204).end();
});

// ---------- discounts ----------
const discountsOf = (db) => (db.discounts = db.discounts || []);
const withStatus = (d) => ({ ...d, status: L.discountStatus(d) });

/** Keeps the app banner for a discount in step with its "Show banner in app" switch. */
function syncBanner(db, d) {
  db.banners = db.banners.filter((b) => b.discountId !== d.id);
  if (d.showBanner) db.banners.unshift(A.discountBanner(d, db));
}

function discountContext(db, existing) {
  return { categoryIds: db.categories.map((c) => c.id), productIds: db.products.map((p) => p.id), existing };
}

router.get('/discounts', (_req, res) => {
  const db = store.get();
  res.json({
    stats: A.discountStats(db),
    discounts: discountsOf(db).slice().reverse().map(withStatus),
    coupons: db.promos.map((c) => ({ used: 0, ...c, status: A.couponStatus(c) })),
  });
});

router.post('/discounts', (req, res) => {
  const db = store.get();
  const input = A.discountInput(req.body, discountContext(db, null));
  const d = {
    id: `d-${Date.now()}`,
    targetIds: [],
    startsAt: null,
    endsAt: null,
    showBanner: false,
    pushNotify: false,
    draft: false,
    createdAt: new Date().toISOString(),
    ...input,
  };
  discountsOf(db).push(d);
  syncBanner(db, d);
  store.save();
  res.status(201).json(withStatus(d));
});

router.patch('/discounts/:id', (req, res) => {
  const db = store.get();
  const d = discountsOf(db).find((x) => x.id === req.params.id);
  if (!d) throw L.httpError(404, 'Discount not found');
  Object.assign(d, A.discountInput(req.body, { ...discountContext(db, d), partial: true }));
  syncBanner(db, d);
  store.save();
  res.json(withStatus(d));
});

router.delete('/discounts/:id', (req, res) => {
  const db = store.get();
  if (!discountsOf(db).some((x) => x.id === req.params.id)) throw L.httpError(404, 'Discount not found');
  db.discounts = db.discounts.filter((x) => x.id !== req.params.id);
  db.banners = db.banners.filter((b) => b.discountId !== req.params.id);
  store.save();
  res.status(204).end();
});

// ---------- coupons (promo codes) ----------
router.post('/coupons', (req, res) => {
  const db = store.get();
  const input = A.couponInput(req.body);
  if (db.promos.some((c) => c.code === input.code)) throw L.httpError(409, 'That code already exists');
  const c = { minSubtotal: 0, maxUses: null, maxDiscount: null, expiresAt: null, description: '', active: true, used: 0, ...input };
  db.promos.push(c);
  store.save();
  res.status(201).json({ ...c, status: A.couponStatus(c) });
});

router.patch('/coupons/:code', (req, res) => {
  const db = store.get();
  const c = db.promos.find((x) => x.code === req.params.code);
  if (!c) throw L.httpError(404, 'Code not found');
  const input = A.couponInput(req.body, { partial: true });
  if (input.code && input.code !== c.code && db.promos.some((x) => x.code === input.code)) throw L.httpError(409, 'That code already exists');
  Object.assign(c, input);
  store.save();
  res.json({ ...c, status: A.couponStatus(c) });
});

router.delete('/coupons/:code', (req, res) => {
  const db = store.get();
  if (!db.promos.some((x) => x.code === req.params.code)) throw L.httpError(404, 'Code not found');
  db.promos = db.promos.filter((x) => x.code !== req.params.code);
  store.save();
  res.status(204).end();
});

// ---------- users & login activity ----------
router.get('/users', (req, res) => {
  const db = store.get();
  const words = String(req.query.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  let rows = A.userRows(db).filter((u) => {
    const hay = `${u.name || ''} ${u.phone || ''} ${u.email || ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  if (req.query.blocked === 'true') rows = rows.filter((u) => u.blocked);
  rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  res.json({ stats: A.userStats(db), users: rows });
});

router.get('/users/:id', (req, res) => {
  const db = store.get();
  const user = A.userRows(db).find((u) => u.id === req.params.id);
  if (!user) throw L.httpError(404, 'User not found');
  res.json({
    user,
    logins: (db.loginEvents || []).filter((e) => e.userId === user.id).slice(-20).reverse(),
    orders: (db.orders || []).filter((o) => o.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
});

router.patch('/users/:id', (req, res) => {
  const db = store.get();
  const u = db.users.find((x) => x.id === req.params.id);
  if (!u) throw L.httpError(404, 'User not found');
  if (typeof req.body.blocked !== 'boolean') throw L.httpError(400, 'Send { blocked: true | false }');
  u.blocked = req.body.blocked;
  store.save();
  res.json(A.userRows(db).find((x) => x.id === u.id));
});

router.get('/login-events', (req, res) => {
  const db = store.get();
  const range = ['today', '7d', '30d', 'all'].includes(req.query.range) ? req.query.range : 'today';
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const all = A.loginEvents(db, { range, q: req.query.q });
  res.json({ stats: A.userStats(db), total: all.length, items: all.slice(offset, offset + limit) });
});

module.exports = router;
