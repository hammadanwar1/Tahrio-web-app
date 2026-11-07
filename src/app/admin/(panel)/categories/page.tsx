import type { Metadata } from 'next';

import { CategoryRow, NewCategoryForm } from '@/components/admin/category-forms';
import { ApiError, Card, PageHeader } from '@/components/admin/page-header';
import { loadAdmin, type AdminCategory } from '@/lib/admin/api';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const { data, error } = await loadAdmin<(AdminCategory & { discountPercent?: number })[]>('/categories');
  if (!data) return <ApiError message={error} />;
  return (
    <>
      <PageHeader title="Categories" description="Rename categories or put a whole category on sale. A category must be empty before you delete it." />
      <div className="grid items-start gap-4 xl:grid-cols-[1fr_340px]">
        <Card className="divide-y divide-line py-1">
          {data.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </Card>
        <Card>
          <NewCategoryForm />
        </Card>
      </div>
    </>
  );
}
