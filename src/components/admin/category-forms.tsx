'use client';

import { useActionState } from 'react';

import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from '@/lib/admin/actions';
import type { AdminCategory } from '@/lib/admin/api';
import { ActionButton, FormMessage, SubmitButton, inputClass } from './ui';

export function NewCategoryForm() {
  const [state, formAction] = useActionState(createCategoryAction, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <h2 className="font-semibold">Add category</h2>
      <input name="name" required maxLength={40} placeholder="Name, e.g. Phone Cases" aria-label="Name" className={inputClass} />
      <input name="shortName" maxLength={20} placeholder="Short name (optional)" aria-label="Short name" className={inputClass} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Discount % for the whole category
        <input name="discountPercent" type="number" min={0} max={90} defaultValue={0} className={inputClass} />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Adding…">Add category</SubmitButton>
    </form>
  );
}

export function CategoryRow({ category }: { category: AdminCategory & { discountPercent?: number } }) {
  const [state, formAction] = useActionState(updateCategoryAction.bind(null, category.id), undefined);
  return (
    <div className="flex flex-col gap-2 py-4">
      <form action={formAction} className="grid items-end gap-3 sm:grid-cols-[1fr_160px_110px_auto]">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Name
          <input name="name" required maxLength={40} defaultValue={category.name} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Short name
          <input name="shortName" maxLength={20} defaultValue={category.shortName} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Discount %
          <input name="discountPercent" type="number" min={0} max={90} defaultValue={category.discountPercent ?? 0} className={inputClass} />
        </label>
        <SubmitButton className="px-5">Save</SubmitButton>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>
          {category.itemCount} product{category.itemCount === 1 ? '' : 's'}
          {category.badge ? ` · badge ${category.badge}` : ''}
        </span>
        <ActionButton variant="danger" confirm={`Delete the “${category.name}” category?`} action={deleteCategoryAction.bind(null, category.id)}>
          Delete
        </ActionButton>
        <FormMessage state={state} />
      </div>
    </div>
  );
}
