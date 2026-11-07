import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, Card, PageHeader, StatusBadge } from '@/components/admin/page-header';
import { loadAdmin, type Dashboard } from '@/lib/admin/api';
import { rs } from '@/lib/format';

export const metadata: Metadata = { title: 'Dashboard' };

const RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '12m', label: '12 months' },
] as const;

function Change({ value }: { value: number | null }) {
  if (value === null) return null;
  return <span className={`text-xs font-semibold ${value >= 0 ? 'text-success' : 'text-danger'}`}>{value >= 0 ? '▲' : '▼'} {Math.abs(value)}%</span>;
}

export default async function DashboardPage({ searchParams }: PageProps<'/admin'>) {
  const { range: rawRange } = await searchParams;
  const range = RANGES.some((r) => r.id === rawRange) ? (rawRange as string) : '7d';
  const { data, error } = await loadAdmin<Dashboard>(`/dashboard?range=${range}`);
  if (!data) return <ApiError message={error} />;

  const { stats, sales } = data;
  const peak = Math.max(1, ...sales.series.map((s) => s.total));
  const tiles = [
    { label: 'Sales', value: rs(stats.sales.value), change: stats.sales.change },
    { label: 'Orders', value: String(stats.orders.value), change: stats.orders.change, note: data.pendingOrders ? `${data.pendingOrders} to fulfil` : undefined },
    { label: 'Customers', value: String(stats.customers.value), change: stats.customers.change, note: `${data.online} online now` },
    { label: 'Products', value: String(stats.products.value), change: null, note: stats.products.lowStock ? `${stats.products.lowStock} low on stock` : undefined },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="How the store is doing."
        actions={
          <div className="flex gap-1 rounded-chip bg-surface p-1 shadow-card">
            {RANGES.map((r) => (
              <Link
                key={r.id}
                href={`/admin?range=${r.id}`}
                className={`rounded-[10px] px-3 py-1.5 text-sm font-medium ${r.id === range ? 'bg-primary text-white' : 'text-muted hover:text-ink'}`}
              >
                {r.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 text-2xl font-bold">{t.value}</p>
            <div className="mt-1 flex items-center gap-2">
              <Change value={t.change} />
              {t.note && <span className="text-xs text-muted">{t.note}</span>}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Sales</h2>
            <p className="text-sm text-muted">
              {rs(sales.total)} total · {rs(sales.avgOrder)} avg order
            </p>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2" role="img" aria-label="Sales per period">
            {sales.series.map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-2" title={`${s.label}: ${rs(s.total)} · ${s.orders} orders`}>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md bg-primary" style={{ height: `${Math.max(2, (s.total / peak) * 100)}%`, opacity: s.total ? 1 : 0.15 }} />
                </div>
                <span className="text-[11px] text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
              All orders
            </Link>
          </div>
          {data.recentOrders.length ? (
            <ul className="mt-4 divide-y divide-line">
              {data.recentOrders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold">#{o.number}</p>
                    <p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold">{rs(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No orders yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}
