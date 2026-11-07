export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-card bg-surface p-5 shadow-card ${className}`}>{children}</section>;
}

/** Message shown in place of a page when the API call fails (backend down, wrong key…). */
export function ApiError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
      <p className="font-semibold">Couldn&apos;t load data from the Tahrio API</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-primary-soft text-primary',
  confirmed: 'bg-primary-soft text-primary',
  packed: 'bg-amber-100 text-amber-800',
  out_for_delivery: 'bg-fuchsia-100 text-fuchsia-800',
  delivered: 'bg-green-100 text-green-800',
  published: 'bg-green-100 text-green-800',
  draft: 'bg-line text-muted',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-chip px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-line text-muted'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
