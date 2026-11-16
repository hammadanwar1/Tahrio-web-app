import type { Metadata } from 'next';

import { BrandRow, NewBrandForm } from '@/components/admin/brand-forms';
import { ApiError, Card, PageHeader } from '@/components/admin/page-header';
import { loadAdmin, type AdminBrand } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Brands' };

export default async function BrandsPage() {
  const { data, error } = await loadAdmin<AdminBrand[]>('/brands');
  if (!data) return <ApiError message={error} />;
  return (
    <>
      <PageHeader
        title="Brands"
        description="Logos and order of “Shop by Brand” on the website. Set a product's brand on the product page; it then appears under that brand."
      />
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="divide-y divide-line py-1">
          {data.map((b, i) => (
            <BrandRow key={b.id} brand={b} first={i === 0} last={i === data.length - 1} />
          ))}
        </Card>
        <Card>
          <NewBrandForm />
        </Card>
      </div>
    </>
  );
}
