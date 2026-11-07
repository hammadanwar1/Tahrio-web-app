'use client';

import { useActionState } from 'react';

import { loginAction } from '@/lib/admin/actions';
import { FormMessage, SubmitButton, inputClass } from './ui';

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);
  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input name="password" type="password" required autoFocus autoComplete="current-password" className={inputClass} />
      </label>
      <FormMessage state={state} />
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
