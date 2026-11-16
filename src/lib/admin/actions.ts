'use server';
// Admin Server Actions. Each one goes through adminFetch(), which re-checks the admin session.
// Catalog edits also expire the storefront's 'catalog' cache so shoppers see them right away.

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { AdminApiError, adminFetch, type AdminProduct } from './api';
import { adminConfigured, checkPassword, createSession, deleteSession } from './session';

export type FormState = { error?: string; message?: string } | undefined;

const fail = (err: unknown): FormState => {
  if (err instanceof AdminApiError) return { error: err.message };
  throw err; // redirects (expired session) and real bugs
};

// ---------- auth ----------

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!adminConfigured()) return { error: 'Admin login is not set up. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET to .env.local.' };
  if (!checkPassword(String(formData.get('password') ?? ''))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: 'Wrong password' };
  }
  await createSession();
  redirect('/admin');
}

export async function logoutAction() {
  await deleteSession();
  redirect('/admin/login');
}

// ---------- orders ----------

export async function advanceOrderAction(orderId: string): Promise<FormState> {
  try {
    await adminFetch(`/orders/${encodeURIComponent(orderId)}/advance`, { method: 'POST' });
  } catch (err) {
    return fail(err);
  }
  refresh();
}

// ---------- products ----------

const text = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const optionalNumber = (f: FormData, k: string) => (text(f, k) === '' ? null : Number(text(f, k)));

async function uploadImage(file: File) {
  const { url } = await adminFetch<{ url: string }>('/uploads', { method: 'POST', raw: file });
  return url;
}

/**
 * Upload ticket for the product form: the browser uploads photos and videos straight to the API
 * (videos are too big to pass through this server). The admin key stays on the server.
 */
export async function uploadTicketAction(): Promise<{ endpoint: string; ticket: string } | { error: string }> {
  try {
    const { ticket } = await adminFetch<{ ticket: string }>('/upload-ticket', { method: 'POST' });
    return { endpoint: `${(process.env.TAHRIO_API_URL ?? '').replace(/\/$/, '')}/admin/uploads`, ticket };
  } catch (err) {
    if (err instanceof AdminApiError) return { error: err.message };
    throw err;
  }
}

const lines = (f: FormData, k: string) =>
  text(f, k)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** "Key: Value" per line → [{ key, value }] (lines without a colon are skipped). */
function specRows(f: FormData) {
  return lines(f, 'specs').flatMap((l) => {
    const i = l.indexOf(':');
    return i > 0 ? [{ key: l.slice(0, i).trim(), value: l.slice(i + 1).trim() }] : [];
  });
}

export async function saveProductAction(productId: string | null, _prev: FormState, f: FormData): Promise<FormState> {
  let saved: AdminProduct;
  try {
    // Photos and video were already uploaded by the browser (MediaManager); these are their URLs.
    const images = JSON.parse(text(f, 'images') || '[]') as string[];
    const body = {
      name: text(f, 'name'),
      fullName: text(f, 'fullName') || text(f, 'name'),
      categoryId: text(f, 'categoryId'),
      label: text(f, 'label'),
      brand: text(f, 'brand'),
      models: [...new Set(text(f, 'models').split(/[\n,]/).map((m) => m.trim()).filter(Boolean))],
      description: text(f, 'description'),
      price: text(f, 'price'),
      oldPrice: optionalNumber(f, 'oldPrice'),
      stock: optionalNumber(f, 'stock'),
      images, // the API makes the first one the main photo (imageUrl)
      videoUrl: text(f, 'videoUrl') || null,
      highlights: lines(f, 'highlights'),
      specs: specRows(f),
      status: f.get('published') ? 'published' : 'draft',
      inStock: Boolean(f.get('inStock')),
      hot: Boolean(f.get('hot')),
      isNew: Boolean(f.get('isNew')),
    };
    saved = productId
      ? await adminFetch<AdminProduct>(`/products/${encodeURIComponent(productId)}`, { method: 'PATCH', body })
      : await adminFetch<AdminProduct>('/products', { method: 'POST', body });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  if (!productId) redirect(`/admin/products/${saved.id}?created=1`);
  refresh();
  return { message: 'Saved. The store now shows these changes.' };
}

export async function deleteProductAction(productId: string): Promise<FormState> {
  try {
    await adminFetch(`/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  redirect('/admin/products');
}

// ---------- categories ----------

export async function createCategoryAction(_prev: FormState, f: FormData): Promise<FormState> {
  try {
    await adminFetch('/categories', {
      method: 'POST',
      body: { name: text(f, 'name'), shortName: text(f, 'shortName') || text(f, 'name'), discountPercent: Number(text(f, 'discountPercent') || 0) },
    });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
  return { message: 'Category added' };
}

export async function updateCategoryAction(categoryId: string, _prev: FormState, f: FormData): Promise<FormState> {
  try {
    await adminFetch(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'PATCH',
      body: { name: text(f, 'name'), shortName: text(f, 'shortName') || text(f, 'name'), discountPercent: Number(text(f, 'discountPercent') || 0) },
    });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
  return { message: 'Saved' };
}

export async function deleteCategoryAction(categoryId: string): Promise<FormState> {
  try {
    await adminFetch(`/categories/${encodeURIComponent(categoryId)}`, { method: 'DELETE' });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
}

// ---------- brands ----------

/** Name, colour and (optionally) a newly uploaded logo from a brand form. */
async function brandBody(f: FormData) {
  const logo = f.get('logo');
  return {
    name: text(f, 'name'),
    color: text(f, 'color') || null,
    ...(logo instanceof File && logo.size > 0 ? { logoUrl: await uploadImage(logo) } : {}),
    ...(f.get('removeLogo') ? { logoUrl: null } : {}),
  };
}

export async function createBrandAction(_prev: FormState, f: FormData): Promise<FormState> {
  try {
    await adminFetch('/brands', { method: 'POST', body: await brandBody(f) });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
  return { message: 'Brand added' };
}

export async function updateBrandAction(brandId: string, _prev: FormState, f: FormData): Promise<FormState> {
  try {
    await adminFetch(`/brands/${encodeURIComponent(brandId)}`, { method: 'PATCH', body: await brandBody(f) });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
  return { message: 'Saved' };
}

export async function moveBrandAction(brandId: string, direction: 'up' | 'down'): Promise<FormState> {
  try {
    await adminFetch(`/brands/${encodeURIComponent(brandId)}/move`, { method: 'POST', body: { direction } });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
}

export async function deleteBrandAction(brandId: string): Promise<FormState> {
  try {
    await adminFetch(`/brands/${encodeURIComponent(brandId)}`, { method: 'DELETE' });
  } catch (err) {
    return fail(err);
  }
  updateTag('catalog');
  refresh();
}

// ---------- customers ----------

export async function setUserBlockedAction(userId: string, blocked: boolean): Promise<FormState> {
  try {
    await adminFetch(`/users/${encodeURIComponent(userId)}`, { method: 'PATCH', body: { blocked } });
  } catch (err) {
    return fail(err);
  }
  refresh();
}
