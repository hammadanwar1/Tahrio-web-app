import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { AdminNav } from '@/components/admin/admin-nav';
import { Logo } from '@/components/logo';
import { logoutAction } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/session';

// Every admin page reads the session cookie and live API data, so it always renders per request.
export const instant = false;

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-line bg-surface p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin" aria-label="Tahrio Admin home" className="flex items-center gap-2">
            <Logo size={34} />
            <span className="rounded-chip bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">Admin</span>
          </Link>
        </div>
        <Suspense>
          <AdminNav />
        </Suspense>
        <div className="mt-auto hidden flex-col gap-1 lg:flex">
          <Link href="/" className="rounded-chip px-3 py-2 text-sm text-muted hover:text-ink">
            View store ↗
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-chip px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-danger">
              <LogOut size={18} aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
        <form action={logoutAction} className="mt-10 lg:hidden">
          <button type="submit" className="text-sm font-medium text-muted hover:text-danger">
            Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
