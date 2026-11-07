import type { Metadata } from 'next';

import { ApiError, Card, PageHeader, StatusBadge } from '@/components/admin/page-header';
import { ActionButton } from '@/components/admin/ui';
import { advanceOrderAction } from '@/lib/admin/actions';
import { loadAdmin, type AdminOrder } from '@/lib/admin/api';
import { rs } from '@/lib/format';

export const metadata: Metadata = { title: 'Orders' };

const STEPS = ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
const nextStep = (status: string) => STEPS[STEPS.indexOf(status) + 1]?.replace(/_/g, ' ');

export default async function OrdersPage() {
  const { data, error } = await loadAdmin<AdminOrder[]>('/orders');
  if (!data) return <ApiError message={error} />;
  const orders = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader title="Orders" description={`${orders.length} order${orders.length === 1 ? '' : 's'} from the app and website.`} />
      {orders.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No orders yet. Orders placed on the website or app appear here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const next = nextStep(o.status);
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">#{o.number}</h2>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(o.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })} · {o.payment.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{rs(o.total)}</p>
                    <p className="text-xs text-muted">
                      {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <ul className="flex flex-col gap-1">
                    {o.items.map((i, n) => (
                      <li key={n}>
                        {i.qty} × {i.name}
                        {i.variant ? <span className="text-muted"> ({i.variant})</span> : null}
                      </li>
                    ))}
                  </ul>
                  {o.address && (
                    <div className="text-muted">
                      <p className="font-medium text-ink">{o.address.name}</p>
                      {o.address.phone && <p>{o.address.phone}</p>}
                      {o.address.line && <p>{o.address.line}</p>}
                    </div>
                  )}
                </div>
                {next && (
                  <div className="mt-4 border-t border-line pt-4">
                    <ActionButton action={advanceOrderAction.bind(null, o.id)}>Mark as {next}</ActionButton>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
