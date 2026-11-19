import { getAllPromotions } from "@/lib/promotions-store";
import { getSiteSettings } from "@/lib/siteSettings";
import PromotionsManager from "@/components/admin/PromotionsManager";
import PopupSettingsForm from "@/components/admin/PopupSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const [promotions, settings] = await Promise.all([getAllPromotions(), getSiteSettings()]);

  // Даты через границу сервер/клиент передаём ISO-строками: форма всё равно
  // работает со строковыми значениями полей.
  const serialized = promotions.map((promotion) => ({
    id: promotion.id,
    slug: promotion.slug,
    title: promotion.title,
    description: promotion.description,
    imageUrl: promotion.imageUrl,
    kind: promotion.kind,
    value: promotion.value,
    maxDiscount: promotion.maxDiscount,
    minOrderTotal: promotion.minOrderTotal,
    scope: promotion.scope,
    dishIds: promotion.dishIds,
    categoryIds: promotion.categoryIds,
    startsAt: promotion.startsAt ? promotion.startsAt.toISOString() : null,
    endsAt: promotion.endsAt ? promotion.endsAt.toISOString() : null,
    weekdays: promotion.weekdays,
    timeFrom: promotion.timeFrom,
    timeTo: promotion.timeTo,
    priority: promotion.priority,
    stackable: promotion.stackable,
    isEnabled: promotion.isEnabled,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Акции и скидки</h1>
      <p className="mt-1 text-sm text-ink/60">
        Скидки на блюда, категории и сумму заказа. Действующие акции сразу видны в меню
        и учитываются при оформлении заказа.
      </p>

      <PopupSettingsForm
        initial={{
          popupEnabled: settings.popupEnabled,
          popupTitle: settings.popupTitle,
          popupText: settings.popupText,
          popupImageUrl: settings.popupImageUrl,
        }}
      />

      <PromotionsManager initialPromotions={serialized} />
    </div>
  );
}