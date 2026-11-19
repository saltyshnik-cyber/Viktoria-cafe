import { getCategories } from "@/lib/categories";
import { getAllMenuItemsAdmin } from "@/lib/menu-store";
import { getAllPromotions } from "@/lib/promotions-store";
import PromotionsManager from "@/components/admin/PromotionsManager";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const [promotions, items, categories] = await Promise.all([
    getAllPromotions(),
    getAllMenuItemsAdmin(),
    getCategories(),
  ]);

  const dishes = items.map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
  }));

  // Даты в пропсах — ISO-строки: Date через границу сервер/клиент тянет
  // лишние приведения, а форма всё равно работает со строками.
  const serialized = promotions.map((promotion) => ({
    ...promotion,
    startsAt: promotion.startsAt ? promotion.startsAt.toISOString() : null,
    endsAt: promotion.endsAt ? promotion.endsAt.toISOString() : null,
    createdAt: promotion.createdAt.toISOString(),
    updatedAt: promotion.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Акции и скидки</h1>
      <p className="mt-1 text-sm text-ink/60">
        Скидки на блюда, категории и сумму заказа. Действующие акции сразу видны в меню
        и учитываются при оформлении заказа.
      </p>
      <PromotionsManager
        initialPromotions={serialized}
        dishes={dishes}
        categories={categories}
      />
    </div>
  );
}