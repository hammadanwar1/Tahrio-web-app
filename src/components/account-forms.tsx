'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState, type ReactNode } from 'react';
import { LockKeyhole, LogIn, Mail, Smartphone, UserPlus, UserRound } from 'lucide-react';

import { loginAction, signupAction } from '@/lib/account';
import { detectDevice } from '@/lib/device';

/** Detected device name; empty until the browser has been asked. */
function useDevice() {
  const [device, setDevice] = useState('');
  useEffect(() => {
    detectDevice().then(setDevice, () => setDevice(''));
  }, []);
  return device;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const device = useDevice();
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="device" value={device} />
      <Field label="Email or mobile number" icon={<Mail aria-hidden className="size-5" />}>
        <input
          name="id"
          required
          autoComplete="username"
          defaultValue={state?.values?.id}
          placeholder="you@example.com or 0300-1234567"
          className={inputClass}
        />
      </Field>
      <Field label="Password" icon={<LockKeyhole aria-hidden className="size-5" />}>
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={inputClass} />
      </Field>
      {state?.error && <ErrorText>{state.error}</ErrorText>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Forgot password?{' '}
          <Link href="/contact" className="font-semibold text-ink hover:text-primary">
            Contact us
          </Link>
        </p>
        <SubmitButton pending={pending} icon={<LogIn aria-hidden className="size-5" />}>
          Login
        </SubmitButton>
      </div>
      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-primary">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, undefined);
  const detected = useDevice();
  const v = state?.values;
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Full Name" required>
          <input name="name" required autoComplete="name" defaultValue={v?.name} placeholder="Full name" className={inputClass} />
        </Field>
        <Field label="E-mail Address" required>
          <input name="email" type="email" required autoComplete="email" defaultValue={v?.email} placeholder="Email" className={inputClass} />
        </Field>
        <Field label="Mobile" required>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            defaultValue={v?.phone}
            placeholder="0300-1234567"
            className={inputClass}
          />
        </Field>
        <Field label="Password" required>
          <input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Create password" className={inputClass} />
        </Field>
        <Field label="Re-enter Password" required>
          <input name="confirm" type="password" required minLength={6} autoComplete="new-password" placeholder="Re-type password" className={inputClass} />
        </Field>
        <Field
          label="Device Name"
          required
          icon={<Smartphone aria-hidden className="size-5" />}
          hint="Detected automatically – change it if it isn't right."
        >
          {/* Keyed on the detected name so the field fills in once detection finishes. */}
          <input
            key={detected}
            name="device"
            required
            maxLength={80}
            defaultValue={v?.device || detected}
            placeholder={detected ? 'Your device' : 'Detecting…'}
            className={inputClass}
          />
        </Field>
      </div>
      {state?.error && <ErrorText>{state.error}</ErrorText>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SubmitButton pending={pending} icon={<UserPlus aria-hidden className="size-5" />}>
          Sign Up
        </SubmitButton>
        <p className="text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary">
            Login
          </Link>
        </p>
      </div>
    </form>
  );
}

const inputClass = 'h-12 w-full min-w-0 flex-1 bg-transparent px-4 text-[15px] placeholder:text-muted focus:outline-none';

function Field({
  label,
  required,
  icon = <UserRound aria-hidden className="size-5" />,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <span className="flex items-stretch overflow-hidden rounded-input border border-line bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <span className="flex w-12 shrink-0 items-center justify-center border-r border-line bg-bg text-muted">{icon}</span>
        {children}
      </span>
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function SubmitButton({ pending, icon, children }: { pending: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-gradient-button flex h-12 items-center gap-2 rounded-full px-7 font-semibold text-white disabled:opacity-60"
    >
      {icon}
      {pending ? 'Please wait…' : children}
    </button>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
      {children}
    </p>
  );
}
