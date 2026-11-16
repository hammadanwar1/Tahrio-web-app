import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, PageHeader } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { loadAdmin, type AdminBrand, type AdminCategory } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Add product' };

export default async function NewProductPage() {
  const [{ data, error }, brands] = await Promise.all([loadAdmin<AdminCategory[]>('/categories'), loadAdmin<AdminBrand[]>('/brands')]);
  if (!data) return <ApiError message={error} />;
  return (
    <>
      <Link href="/admin/products" className="text-sm font-medium text-muted hover:text-primary">
        ← Products
      </Link>
      <PageHeader title="Add product" />
      <ProductForm categories={data} brandNames={brands.data?.map((b) => b.name)} />
    </>
  );
}
