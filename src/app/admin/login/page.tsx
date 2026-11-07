import type { Metadata } from 'next';

import { LoginForm } from '@/components/admin/login-form';
import { Logo } from '@/components/logo';

export const metadata: Metadata = { title: 'Sign in' };

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-card bg-surface p-8 shadow-card">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Manage orders, products and customers.</p>
        <LoginForm />
      </div>
    </div>
  );
}
