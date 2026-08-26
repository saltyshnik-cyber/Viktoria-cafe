import { getCategories } from "@/lib/categories";
import CategoriesManager from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Категории меню</h1>
      <p className="mt-1 text-sm text-ink/60">
        Разделы меню (Шашлыки, Салаты и т.д.) и порядок, в котором они показаны на сайте.
      </p>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
