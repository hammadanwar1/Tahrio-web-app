'use client';

import Image from 'next/image';
import { useActionState, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { createBrandAction, deleteBrandAction, moveBrandAction, updateBrandAction } from '@/lib/admin/actions';
import type { AdminBrand } from '@/lib/admin/api';
import { ActionButton, FormMessage, SubmitButton, inputClass } from './ui';

const logoHint = 'PNG with a transparent background works best (JPEG / WebP also fine), up to 5 MB.';

/** Logo preview: the uploaded logo, the file just picked, or the coloured name as fallback. */
function LogoPreview({ name, color, src }: { name: string; color?: string | null; src: string | null }) {
  return (
    <span className="relative flex h-16 w-36 shrink-0 items-center justify-center overflow-hidden rounded-chip border border-line bg-surface px-2">
      {src ? (
        // Blob previews can't go through the image optimiser.
        src.startsWith('blob:') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="max-h-12 max-w-full object-contain" />
        ) : (
          <Image src={src} alt="" fill sizes="144px" className="object-contain p-2" />
        )
      ) : (
        <span className="text-center text-base font-bold leading-tight" style={{ color: color || '#0f1433' }}>
          {name || 'Logo'}
        </span>
      )}
    </span>
  );
}

function LogoInput({ onPick }: { onPick: (url: string | null) => void }) {
  return (
    <input
      name="logo"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={(e) => {
        const file = e.target.files?.[0];
        onPick(file ? URL.createObjectURL(file) : null);
      }}
      className="text-sm file:mr-3 file:rounded-chip file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
    />
  );
}

export function NewBrandForm() {
  const [state, formAction] = useActionState(createBrandAction, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <h2 className="font-semibold">Add brand</h2>
      <LogoPreview name={name} src={preview} />
      <input
        name="name"
        required
        maxLength={40}
        placeholder="Name, e.g. Anker"
        aria-label="Name"
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Logo
        <LogoInput onPick={setPreview} />
        <span className="text-xs font-normal text-muted">{logoHint}</span>
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        Name colour (shown when there&apos;s no logo)
        <input name="color" type="color" defaultValue="#0f1433" className="h-8 w-12 rounded border border-line" />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Adding…">Add brand</SubmitButton>
    </form>
  );
}

export function BrandRow({ brand, first, last }: { brand: AdminBrand; first: boolean; last: boolean }) {
  const [state, formAction] = useActionState(updateBrandAction.bind(null, brand.id), undefined);
  const [preview, setPreview] = useState<string | null>(brand.logoUrl ?? null);
  return (
    <div className="flex flex-col gap-3 py-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <LogoPreview name={brand.name} color={brand.color} src={preview} />
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium text-muted">
          Name
          <input name="name" required maxLength={40} defaultValue={brand.name} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {brand.logoUrl ? 'Replace logo' : 'Upload logo'}
          <LogoInput onPick={(url) => setPreview(url ?? brand.logoUrl ?? null)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Colour
          <input name="color" type="color" defaultValue={brand.color || '#0f1433'} className="h-11 w-12 rounded border border-line" />
        </label>
        <SubmitButton className="px-5">Save</SubmitButton>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span>
          {brand.productCount} product{brand.productCount === 1 ? '' : 's'}
        </span>
        <span className="flex gap-1">
          <ActionButton variant="ghost" action={moveBrandAction.bind(null, brand.id, 'up')}>
            <ArrowUp size={14} aria-label="Move up" />
          </ActionButton>
          <ActionButton variant="ghost" action={moveBrandAction.bind(null, brand.id, 'down')}>
            <ArrowDown size={14} aria-label="Move down" />
          </ActionButton>
        </span>
        {(first || last) && <span>{first ? 'First in the menu' : 'Last in the menu'}</span>}
        {brand.logoUrl && (
          <ActionButton
            variant="ghost"
            confirm={`Remove the ${brand.name} logo? Its name will be shown instead.`}
            action={async () => {
              const f = new FormData();
              f.set('name', brand.name);
              f.set('color', brand.color || '');
              f.set('removeLogo', '1');
              return updateBrandAction(brand.id, undefined, f);
            }}
          >
            Remove logo
          </ActionButton>
        )}
        <ActionButton
          variant="danger"
          confirm={`Delete the “${brand.name}” brand from the menu?${brand.productCount ? ` Its ${brand.productCount} products stay in the store.` : ''}`}
          action={deleteBrandAction.bind(null, brand.id)}
        >
          Delete
        </ActionButton>
        <FormMessage state={state} />
      </div>
    </div>
  );
}
