import { getCategories } from "@/lib/categories";
import { getAllMenuItemsAdmin } from "@/lib/menu-store";
import AdminMenuManager from "@/components/admin/AdminMenuManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [items, categories] = await Promise.all([
    getAllMenuItemsAdmin(),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Меню</h1>
      <AdminMenuManager categories={categories} initialItems={items} />
    </div>
  );
}
