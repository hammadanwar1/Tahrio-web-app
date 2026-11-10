// Pure logic behind the admin panel: input validation for categories, discounts and coupons,
// login-event device parsing and the dashboard / users / discounts statistics. No I/O.

const { DAY, discountPercent, discountStatus, httpError, isListed } = require('./logic');

// Pakistan has no DST, so day/month buckets use a fixed UTC+5 offset.
const PK_OFFSET = 5 * 60 * 60 * 1000;
const ONLINE_WINDOW = 5 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Small field validators shared by the *Input functions. `partial` = PATCH. */
function reader(body, partial) {
  const b = body || {};
  const out = {};
  const has = (k) => b[k] !== undefined;
  const missing = (k, required) => {
    if (required && !partial) throw httpError(400, `${k} is required`);
  };
  return {
    b,
    out,
    has,
    str(k, { required = false, max = 200, nullable = false } = {}) {
      if (!has(k)) return missing(k, required);
      if (b[k] === null || b[k] === '') {
        if (required) throw httpError(400, `${k} is required`);
        return void (out[k] = nullable ? null : '');
      }
      const v = String(b[k]).trim();
      if (v.length > max) throw httpError(400, `${k} must be at most ${max} characters`);
      out[k] = v;
    },
    num(k, { required = false, nullable = false, min = 0, max = Infinity } = {}) {
      if (!has(k)) return missing(k, required);
      if ((b[k] === null || b[k] === '') && nullable) return void (out[k] = null);
      const v = Number(b[k]);
      if (!Number.isFinite(v) || v < min || v > max) throw httpError(400, `${k} must be between ${min} and ${max}`);
      out[k] = Math.round(v);
    },
    bool(k) {
      if (has(k)) out[k] = b[k] === true || b[k] === 'true' || b[k] === 1 || b[k] === '1';
    },
    oneOf(k, values, { required = false } = {}) {
      if (!has(k)) return missing(k, required);
      if (!values.includes(b[k])) throw httpError(400, `${k} must be one of ${values.join(', ')}`);
      out[k] = b[k];
    },
    date(k) {
      if (!has(k)) return;
      if (b[k] === null || b[k] === '') return void (out[k] = null);
      const t = Date.parse(b[k]);
      if (Number.isNaN(t)) throw httpError(400, `${k} must be a date`);
      out[k] = new Date(t).toISOString();
    },
  };
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Unique id from a name, e.g. "Gaming Accessories" → "gaming-accessories(-2)". */
function uniqueId(name, taken, fallback) {
  const base = slugify(name) || fallback;
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
}

function categoryInput(body, { partial = false, categories = [], selfId = null } = {}) {
  const r = reader(body, partial);
  r.str('name', { required: true, max: 40 });
  r.str('shortName', { max: 20 });
  r.str('icon', { max: 40 });
  r.str('imageUrl', { max: 500, nullable: true });
  r.str('parentId', { max: 60, nullable: true });
  r.num('discountPercent', { min: 0, max: 90 });
  r.bool('showOnHome');
  r.bool('showInSaleBanner');
  const { out } = r;
  if (out.parentId) {
    if (out.parentId === selfId) throw httpError(400, 'A category cannot be its own parent');
    if (!categories.some((c) => c.id === out.parentId)) throw httpError(400, 'Unknown parent category');
  }
  if (out.imageUrl && !/^https?:\/\//.test(out.imageUrl)) throw httpError(400, 'imageUrl must be an http(s) URL');
  return out;
}

/** Category badge shown by the apps: its discount, else keep a manual "NEW". */
function categoryBadge(c) {
  if (c.discountPercent > 0) return `-${c.discountPercent}%`;
  return c.badge === 'NEW' ? 'NEW' : null;
}

function discountInput(body, { partial = false, categoryIds = [], productIds = [], existing = null } = {}) {
  const r = reader(body, partial);
  r.str('name', { required: true, max: 60 });
  r.oneOf('scope', ['all', 'categories', 'products'], { required: true });
  r.oneOf('type', ['percent', 'flat'], { required: true });
  r.num('value', { required: true, min: 1, max: 1000000 });
  r.date('startsAt');
  r.date('endsAt');
  r.bool('showBanner');
  r.bool('pushNotify');
  r.bool('draft');
  const { out, b, has } = r;
  if (has('targetIds')) {
    if (!Array.isArray(b.targetIds)) throw httpError(400, 'targetIds must be a list');
    out.targetIds = [...new Set(b.targetIds.map(String))];
  }
  const merged = { ...existing, ...out };
  const targets = merged.targetIds || [];
  if (merged.scope === 'categories' && (!targets.length || targets.some((id) => !categoryIds.includes(id)))) {
    throw httpError(400, 'Choose at least one existing category');
  }
  if (merged.scope === 'products' && (!targets.length || targets.some((id) => !productIds.includes(id)))) {
    throw httpError(400, 'Choose at least one existing product');
  }
  if (merged.scope === 'all') out.targetIds = [];
  if (merged.type === 'percent' && merged.value > 90) throw httpError(400, 'A percentage discount can be at most 90%');
  if (merged.startsAt && merged.endsAt && merged.endsAt <= merged.startsAt) throw httpError(400, 'The end must be after the start');
  return out;
}

function couponInput(body, { partial = false } = {}) {
  const r = reader(body, partial);
  r.str('code', { required: true, max: 20 });
  r.oneOf('type', ['flat', 'percent'], { required: true });
  r.num('amount', { required: true, min: 1, max: 1000000 });
  r.num('minSubtotal', { min: 0, max: 10000000 });
  r.num('maxUses', { nullable: true, min: 1, max: 10000000 });
  r.num('maxDiscount', { nullable: true, min: 1, max: 10000000 });
  r.date('expiresAt');
  r.str('description', { max: 80 });
  r.bool('active');
  const { out } = r;
  if (out.code !== undefined) {
    out.code = out.code.toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(out.code)) throw httpError(400, 'Code must be 3–20 letters or digits');
  }
  if (out.type === 'percent' && out.amount > 90) throw httpError(400, 'A percentage code can be at most 90%');
  return out;
}

/** Banner the apps show while a discount with "Show banner in app" is running. */
function discountBanner(d, db) {
  const cats = d.scope === 'categories' ? db.categories.filter((c) => d.targetIds.includes(c.id)) : [];
  const names = cats.map((c) => c.shortName || c.name);
  return {
    id: `discount-${d.id}`,
    discountId: d.id,
    placement: 'home',
    tag: d.name.split(/[·|-]/)[0].trim().toUpperCase().slice(0, 24),
    title: d.type === 'percent' ? `Up to ${d.value}% OFF` : `Rs ${d.value} OFF`,
    subtitle: names.length ? (names.length > 3 ? `${names.slice(0, 3).join(' · ')} & more` : names.join(' · ')) : 'On everything',
    cta: 'Shop now',
    icon: cats[0] ? cats[0].icon : 'earbuds',
    ...(cats[0] ? { categoryId: cats[0].id } : {}),
  };
}

/** Device / platform / city for a login event. Apps can send x-client-* headers; else parse the UA. */
function clientInfo(headers = {}) {
  const ua = String(headers['user-agent'] || '');
  const clip = (v) => (v ? String(v).trim().slice(0, 40) || null : null);
  const hinted = String(headers['x-client-platform'] || '').toLowerCase();
  const platform = ['app', 'web'].includes(hinted) ? hinted : /dart|flutter|okhttp/i.test(ua) ? 'app' : 'web';
  let device = clip(headers['x-client-device']);
  if (!device) {
    const os = /iphone/i.test(ua) ? 'iPhone' : /ipad/i.test(ua) ? 'iPad' : /android/i.test(ua) ? 'Android' : null;
    if (platform === 'app') device = os || 'App';
    else {
      const browser = /edg\//i.test(ua) ? 'Edge' : /firefox\//i.test(ua) ? 'Firefox' : /chrome\//i.test(ua) ? 'Chrome' : /safari\//i.test(ua) ? 'Safari' : null;
      device = browser || os || 'Browser';
    }
  }
  return { platform, device, city: clip(headers['x-client-city']) };
}

const pkDate = (t) => new Date(t + PK_OFFSET);
/** Start of the Pakistan-time day containing t (as a UTC ms timestamp). */
function dayStart(t) {
  const d = pkDate(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - PK_OFFSET;
}
function monthStart(t, add = 0) {
  const d = pkDate(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + add, 1) - PK_OFFSET;
}

const pctChange = (now, before) => (before ? Math.round(((now - before) / before) * 1000) / 10 : null);
const time = (iso) => (iso ? Date.parse(iso) : 0);
const between = (iso, from, to) => {
  const t = time(iso);
  return t >= from && t < to;
};
const counted = (o) => o.status !== 'cancelled';

function isOnline(u, now) {
  return Boolean(u.lastSeenAt) && now - time(u.lastSeenAt) < ONLINE_WINDOW;
}

function lowStock(p) {
  if (p.stock == null) return !p.inStock;
  return p.stock <= (p.lowStockAt ?? 5);
}

/** Sales buckets for the dashboard chart: 7d (days), 30d (days), 12m (months). */
function salesSeries(orders, range, now) {
  const buckets = [];
  if (range === '12m') {
    for (let i = 11; i >= 0; i--) {
      const from = monthStart(now, -i);
      buckets.push({ from, to: monthStart(now, -i + 1), label: MONTHS[pkDate(from).getUTCMonth()] });
    }
  } else {
    const days = range === '30d' ? 30 : 7;
    const today = dayStart(now);
    for (let i = days - 1; i >= 0; i--) {
      const from = today - i * DAY;
      const d = pkDate(from);
      buckets.push({ from, to: from + DAY, label: days === 7 ? WEEKDAYS[d.getUTCDay()] : String(d.getUTCDate()) });
    }
  }
  return buckets.map(({ from, to, label }) => {
    const list = orders.filter((o) => between(o.createdAt, from, to));
    return { label, total: list.reduce((s, o) => s + o.total, 0), orders: list.length };
  });
}

function customerName(db, o) {
  const u = db.users.find((x) => x.id === o.userId);
  return (o.address && o.address.name) || (u && u.name) || 'Customer';
}

function dashboard(db, { range = '7d', now = Date.now() } = {}) {
  const orders = (db.orders || []).filter(counted);
  const sum = (list) => list.reduce((s, o) => s + o.total, 0);
  const week = orders.filter((o) => between(o.createdAt, now - 7 * DAY, now + 1));
  const prevWeek = orders.filter((o) => between(o.createdAt, now - 14 * DAY, now - 7 * DAY));
  const customers = db.users.filter((u) => !u.isGuest);
  const newCustomers = customers.filter((u) => between(u.createdAt, now - 7 * DAY, now + 1)).length;
  const prevCustomers = customers.filter((u) => time(u.createdAt) < now - 7 * DAY).length;

  const series = salesSeries(orders, range, now);
  const seriesTotal = series.reduce((s, b) => s + b.total, 0);
  const seriesOrders = series.reduce((s, b) => s + b.orders, 0);
  const best = series.reduce((a, b) => (b.total > a.total ? b : a), series[0]);

  const productCat = Object.fromEntries(db.products.map((p) => [p.id, p.categoryId]));
  const byCat = {};
  for (const o of orders) {
    for (const i of o.items) {
      const cat = i.categoryId || productCat[i.productId];
      if (cat) byCat[cat] = (byCat[cat] || 0) + i.price * i.qty;
    }
  }
  const topCategories = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, revenue]) => {
      const c = db.categories.find((x) => x.id === id);
      return { id, name: c ? c.name : id, icon: c ? c.icon : 'case', revenue };
    });

  const events = (db.loginEvents || []).filter((e) => e.result !== 'failed');
  return {
    stats: {
      sales: { value: sum(week), change: pctChange(sum(week), sum(prevWeek)) },
      orders: { value: (db.orders || []).length, change: pctChange(week.length, prevWeek.length) },
      customers: { value: customers.length, change: pctChange(customers.length, prevCustomers), new: newCustomers },
      products: { value: db.products.length, lowStock: db.products.filter(lowStock).length },
    },
    sales: {
      range,
      series,
      total: seriesTotal,
      best: best && best.total ? { label: best.label, total: best.total } : null,
      avgOrder: seriesOrders ? Math.round(seriesTotal / seriesOrders) : 0,
    },
    topCategories,
    recentOrders: (db.orders || [])
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((o) => ({ id: o.id, number: o.number, customer: customerName(db, o), items: o.itemCount, total: o.total, status: o.status, createdAt: o.createdAt })),
    recentLogins: events
      .slice(-5)
      .reverse()
      .map((e) => {
        const u = db.users.find((x) => x.id === e.userId);
        return { ...e, online: Boolean(u && isOnline(u, now)) };
      }),
    online: db.users.filter((u) => isOnline(u, now)).length,
    pendingOrders: (db.orders || []).filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
  };
}

/** Per-user rollup for the Users tab. */
function userRows(db, now = Date.now()) {
  const orders = db.orders || [];
  const lastLogin = {};
  for (const e of db.loginEvents || []) if (e.userId && e.result !== 'failed') lastLogin[e.userId] = e;
  return db.users.map((u) => {
    const { passwordHash, ...rest } = u;
    const mine = orders.filter((o) => o.userId === u.id && counted(o));
    return {
      ...rest,
      blocked: Boolean(u.blocked),
      online: isOnline(u, now),
      orders: mine.length,
      spent: mine.reduce((s, o) => s + o.total, 0),
      lastLogin: lastLogin[u.id] || null,
    };
  });
}

function userStats(db, now = Date.now()) {
  const events = db.loginEvents || [];
  const today = dayStart(now);
  const todays = events.filter((e) => time(e.createdAt) >= today && e.result !== 'failed');
  const share = (m) => (todays.length ? Math.round((todays.filter((e) => e.method === m).length / todays.length) * 100) : 0);
  const customers = db.users.filter((u) => !u.isGuest);
  return {
    total: customers.length,
    newThisWeek: customers.filter((u) => between(u.createdAt, now - 7 * DAY, now + 1)).length,
    online: db.users.filter((u) => isOnline(u, now)).length,
    loginsToday: todays.length,
    methodShare: { password: share('password'), google: share('google'), guest: share('guest') },
    failed24h: events.filter((e) => e.result === 'failed' && time(e.createdAt) >= now - DAY).length,
    blocked: db.users.filter((u) => u.blocked).length,
  };
}

/** Login events, newest first, filtered by range (today | 7d | 30d | all) and a name/phone query. */
function loginEvents(db, { range = 'today', q = '', now = Date.now() } = {}) {
  const from = range === 'today' ? dayStart(now) : range === '7d' ? now - 7 * DAY : range === '30d' ? now - 30 * DAY : 0;
  const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  return (db.loginEvents || [])
    .filter((e) => time(e.createdAt) >= from)
    .filter((e) => {
      const hay = `${e.name || ''} ${e.phone || ''} ${e.email || ''}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    })
    .reverse()
    .map((e) => {
      const u = e.userId && db.users.find((x) => x.id === e.userId);
      return { ...e, online: Boolean(u && isOnline(u, now)), blocked: Boolean(u && u.blocked) };
    });
}

function discountStats(db, now = Date.now()) {
  const statuses = (db.discounts || []).map((d) => ({ d, s: discountStatus(d, now) }));
  const running = statuses.filter(({ s }) => s === 'live' || s === 'ending');
  const monthFrom = monthStart(now);
  const prevFrom = monthStart(now, -1);
  const saleRevenue = (from, to) =>
    (db.orders || [])
      .filter((o) => counted(o) && between(o.createdAt, from, to))
      .reduce((s, o) => s + o.items.filter((i) => discountPercent(i) > 0).reduce((t, i) => t + i.price * i.qty, 0), 0);
  const thisMonth = saleRevenue(monthFrom, now + 1);
  return {
    active: running.length,
    endingThisWeek: running.filter(({ d }) => d.endsAt && time(d.endsAt) - now < 7 * DAY).length,
    couponsRedeemed: (db.orders || []).filter((o) => o.promoCode && between(o.createdAt, monthFrom, now + 1)).length,
    saleRevenue: thisMonth,
    saleRevenueChange: pctChange(thisMonth, saleRevenue(prevFrom, monthFrom)),
  };
}

function couponStatus(c, now = Date.now()) {
  if (c.active === false) return 'paused';
  if (c.expiresAt && time(c.expiresAt) <= now) return 'expired';
  if (c.maxUses && (c.used || 0) >= c.maxUses) return 'used_up';
  if (c.expiresAt && time(c.expiresAt) - now < 7 * DAY) return 'expiring';
  return 'active';
}

module.exports = {
  categoryBadge,
  categoryInput,
  clientInfo,
  couponInput,
  couponStatus,
  dashboard,
  discountBanner,
  discountInput,
  discountStats,
  isListed,
  loginEvents,
  lowStock,
  uniqueId,
  userRows,
  userStats,
};
