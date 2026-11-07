import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApiError, PageHeader } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { loadAdmin, type AdminCategory, type AdminProduct } from '@/lib/admin/api';
import { productImage, productPath } from '@/lib/catalog-core';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params, searchParams }: PageProps<'/admin/products/[id]'>) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    loadAdmin<AdminProduct>(`/products/${encodeURIComponent(id)}`),
    loadAdmin<AdminCategory[]>('/categories'),
  ]);
  if (product.error === 'Product not found') notFound();
  if (!product.data || !categories.data) return <ApiError message={(product.error ?? categories.error)!} />;

  const p = product.data;
  return (
    <>
      <Link href="/admin/products" className="text-sm font-medium text-muted hover:text-primary">
        ← Products
      </Link>
      <PageHeader
        title={p.name}
        description={created ? 'Product created. It is now in the store.' : undefined}
        actions={
          p.status === 'published' ? (
            <Link href={productPath(p)} target="_blank" className="text-sm font-medium text-primary hover:underline">
              View in store ↗
            </Link>
          ) : null
        }
      />
      <ProductForm key={p.id} product={p} categories={categories.data} imageSrc={productImage(p)} />
    </>
  );
}
