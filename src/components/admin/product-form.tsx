'use client';

import { useActionState, useState } from 'react';

import { deleteProductAction, saveProductAction } from '@/lib/admin/actions';
import type { AdminCategory, AdminProduct } from '@/lib/admin/api';
import { ActionButton, FormMessage, SubmitButton, inputClass } from './ui';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-primary" />
      {label}
    </label>
  );
}

export function ProductForm({ product, categories, imageSrc }: { product?: AdminProduct; categories: AdminCategory[]; imageSrc?: string | null }) {
  const [state, formAction] = useActionState(saveProductAction.bind(null, product?.id ?? null), undefined);
  const [preview, setPreview] = useState(imageSrc ?? null);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Details</h2>
          <Field label="Name" hint="Short name shown on cards (max 60 characters)">
            <input name="name" required maxLength={60} defaultValue={product?.name} className={inputClass} />
          </Field>
          <Field label="Full name" hint="Used for the product page title and SEO">
            <input name="fullName" maxLength={140} defaultValue={product?.fullName} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select name="categoryId" required defaultValue={product?.categoryId ?? ''} className={inputClass}>
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label" hint="e.g. “Wireless Earbuds”">
              <input name="label" maxLength={80} defaultValue={product?.label} className={inputClass} />
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" rows={5} maxLength={4000} defaultValue={product?.description} className={`${inputClass} h-auto py-2.5`} />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Price &amp; stock</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (Rs)">
              <input name="price" type="number" min={0} required defaultValue={product?.price} className={inputClass} />
            </Field>
            <Field label="Old price (Rs)" hint="Leave empty for no strikethrough">
              <input name="oldPrice" type="number" min={0} defaultValue={product?.oldPrice ?? ''} className={inputClass} />
            </Field>
            <Field label="Stock" hint="Leave empty to not track">
              <input name="stock" type="number" min={0} defaultValue={product?.stock ?? ''} className={inputClass} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Toggle name="inStock" label="In stock" defaultChecked={product?.inStock ?? true} />
            <Toggle name="hot" label="Hot deal" defaultChecked={product?.hot ?? false} />
            <Toggle name="isNew" label="New arrival" defaultChecked={product?.isNew ?? true} />
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
          <h2 className="font-semibold">Photo</h2>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="aspect-square w-full rounded-image bg-bg object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-image bg-bg text-sm text-muted">No photo</div>
          )}
          <input type="hidden" name="imageUrl" defaultValue={product?.imageUrl ?? ''} />
          <Field label="Upload a new photo" hint="JPEG, PNG or WebP, up to 5 MB">
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
              className="text-sm file:mr-3 file:rounded-chip file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
          <Toggle name="published" label="Published (visible in the store)" defaultChecked={(product?.status ?? 'published') === 'published'} />
          <FormMessage state={state} />
          <SubmitButton>{product ? 'Save changes' : 'Create product'}</SubmitButton>
          {product && (
            <ActionButton variant="danger" confirm={`Delete “${product.name}”? This can't be undone.`} action={deleteProductAction.bind(null, product.id)}>
              Delete product
            </ActionButton>
          )}
        </section>
      </div>
    </form>
  );
}
