import type { Metadata } from 'next';
import { BadgePercent, PackageSearch, Zap } from 'lucide-react';

import { SignupForm } from '@/components/account-forms';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Sign Up',
  description: 'Create your Tahrio account.',
  path: '/signup',
  noindex: true,
});

const benefits = [
  { icon: Zap, text: 'Faster checkout' },
  { icon: PackageSearch, text: 'Track your orders' },
  { icon: BadgePercent, text: 'Member-only deals' },
];

export default function SignupPage() {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-4xl rounded-sheet border border-line bg-surface p-6 shadow-card sm:p-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <span aria-hidden className="bg-gradient-button mt-2 block h-1 w-16 rounded-full" />
          </div>
          <ul aria-label="Signup benefits" className="flex flex-wrap gap-2">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white">
                <Icon aria-hidden className="size-4 text-[#22d3ee]" /> {text}
              </li>
            ))}
          </ul>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
