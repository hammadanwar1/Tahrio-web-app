import type { Metadata } from 'next';

import { ApiError, Card, PageHeader } from '@/components/admin/page-header';
import { ActionButton } from '@/components/admin/ui';
import { setUserBlockedAction } from '@/lib/admin/actions';
import { loadAdmin, type AdminUser } from '@/lib/admin/api';
import { rs } from '@/lib/format';

export const metadata: Metadata = { title: 'Customers' };

export default async function CustomersPage() {
  const { data, error } = await loadAdmin<{ stats: { total: number; online: number; failed24h: number }; users: AdminUser[] }>('/users');
  if (!data) return <ApiError message={error} />;
  const { stats, users } = data;

  return (
    <>
      <PageHeader title="Customers" description={`${stats.total} accounts · ${stats.online} online now · ${stats.failed24h} failed logins in 24h`} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Orders</th>
              <th className="px-5 py-3 font-semibold">Spent</th>
              <th className="px-5 py-3 font-semibold">Last login</th>
              <th className="px-5 py-3 font-semibold">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3">
                  <p className="flex items-center gap-2 font-semibold">
                    {u.name}
                    {u.online && <span className="size-2 rounded-full bg-success" title="Online" />}
                    {u.blocked && <span className="rounded-chip bg-danger/10 px-2 py-0.5 text-xs text-danger">Blocked</span>}
                  </p>
                  <p className="text-xs text-muted">{u.phone ?? u.email ?? (u.isGuest ? 'Guest' : '—')}</p>
                </td>
                <td className="px-5 py-3">{u.orders}</td>
                <td className="px-5 py-3">{rs(u.spent)}</td>
                <td className="px-5 py-3 text-muted">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}
                </td>
                <td className="px-5 py-3 text-right">
                  {u.blocked ? (
                    <ActionButton variant="ghost" action={setUserBlockedAction.bind(null, u.id, false)}>
                      Unblock
                    </ActionButton>
                  ) : (
                    <ActionButton variant="danger" confirm={`Block ${u.name}? They won't be able to sign in.`} action={setUserBlockedAction.bind(null, u.id, true)}>
                      Block
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
