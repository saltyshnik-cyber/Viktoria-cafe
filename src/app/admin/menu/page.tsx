import { categories } from "@/data/menu";
import { getAllMenuItems } from "@/lib/menu-store";
import AdminNav from "@/components/admin/AdminNav";
import AdminMenuManager from "@/components/admin/AdminMenuManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const items = await getAllMenuItems();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold text-ink">Меню</h1>
      <AdminMenuManager categories={categories} initialItems={items} />
    </div>
  );
}
