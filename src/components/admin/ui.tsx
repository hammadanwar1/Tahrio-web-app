'use client';
// Small client building blocks for the admin panel: submit buttons with pending state, form
// messages, and one-click action buttons (with optional confirm) for rows in tables.

import { useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';

import type { FormState } from '@/lib/admin/actions';

export const inputClass = 'h-11 w-full rounded-input border border-line bg-surface px-3.5 text-sm outline-none focus:border-primary';

export function SubmitButton({ children, pendingText = 'Saving…', className = '' }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`bg-gradient-button h-11 rounded-button px-6 text-sm font-semibold text-white disabled:opacity-60 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>;
  if (state?.message) return <p role="status" className="text-sm font-medium text-success">{state.message}</p>;
  return null;
}

export function ActionButton({
  action,
  children,
  confirm,
  variant = 'primary',
}: {
  action: () => Promise<FormState | void>;
  children: React.ReactNode;
  confirm?: string;
  variant?: 'primary' | 'danger' | 'ghost';
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const styles = {
    primary: 'bg-primary-soft text-primary hover:bg-primary hover:text-white',
    danger: 'bg-danger/10 text-danger hover:bg-danger hover:text-white',
    ghost: 'border border-line text-ink hover:border-primary hover:text-primary',
  }[variant];
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(undefined);
          start(async () => {
            const res = await action();
            if (res?.error) setError(res.error);
          });
        }}
        className={`rounded-chip px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${styles}`}
      >
        {pending ? 'Working…' : children}
      </button>
      {error && <span className="max-w-56 text-xs text-danger">{error}</span>}
    </span>
  );
}
