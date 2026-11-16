import type { Metadata } from 'next';

import { LoginForm } from '@/components/account-forms';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Login',
  description: 'Sign in to your Tahrio account.',
  path: '/login',
  noindex: true,
});

export default function LoginPage() {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-xl rounded-sheet border border-line bg-surface p-6 shadow-card sm:p-10">
        <h1 className="mb-1 text-center text-3xl font-bold">Login</h1>
        <p className="mb-8 text-center text-sm text-muted">Welcome back! Sign in with your email or mobile number.</p>
        <LoginForm />
      </div>
    </div>
  );
}
