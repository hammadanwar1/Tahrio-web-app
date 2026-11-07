import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, Card, PageHeader, StatusBadge } from '@/components/admin/page-header';
import { loadAdmin, type AdminCategory, type AdminProduct } from '@/lib/admin/api';
import { productImage } from '@/lib/catalog-core';
import { rs } from '@/lib/format';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  const { q: rawQ } = await searchParams;
  const q = typeof rawQ === 'string' ? rawQ.trim().toLowerCase() : '';
  const [products, categories] = await Promise.all([loadAdmin<AdminProduct[]>('/products'), loadAdmin<AdminCategory[]>('/categories')]);
  if (!products.data || !categories.data) return <ApiError message={(products.error ?? categories.error)!} />;

  const categoryName = new Map(categories.data.map((c) => [c.id, c.name]));
  const list = q ? products.data.filter((p) => `${p.name} ${p.fullName} ${p.sku ?? ''}`.toLowerCase().includes(q)) : products.data;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.data.length} products in the catalog.`}
        actions={
          <Link href="/admin/products/new" className="bg-gradient-button flex h-11 items-center gap-2 rounded-button px-5 text-sm font-semibold text-white">
            <Plus size={18} aria-hidden />
            Add product
          </Link>
        }
      />
      <form className="mb-4">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <input
          id="product-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by name or SKU, then press Enter"
          className="h-11 w-full max-w-md rounded-input border border-line bg-surface px-3.5 text-sm"
        />
      </form>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Product</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Stock</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const img = productImage(p);
              return (
                <tr key={p.id} className="hover:bg-bg">
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-primary">
                      {img ? (
                        // Admin thumbnails: plain <img> so any API image host works without next/image config.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="size-11 rounded-chip bg-bg object-cover" />
                      ) : (
                        <span className="size-11 rounded-chip bg-bg" />
                      )}
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{categoryName.get(p.categoryId) ?? p.categoryId}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold">{rs(p.effective.price)}</span>
                    {p.effective.oldPrice ? <span className="ml-2 text-xs text-muted line-through">{rs(p.effective.oldPrice)}</span> : null}
                  </td>
                  <td className="px-5 py-3">
                    {!p.inStock ? <span className="text-danger">Out of stock</span> : p.stock === null || p.stock === undefined ? <span className="text-muted">—</span> : p.stock}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-5 text-sm text-muted">No products match “{q}”.</p>}
      </Card>
    </>
  );
}
