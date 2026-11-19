import { computePrice } from "@/lib/pricing";
import type { PriceResult } from "@/lib/pricing";
import { getDishPromotions } from "@/lib/promotions-store";
import type { MenuItem } from "@/types/menu";

/**
 * Цены на всё меню разом: акции читаются одним запросом, а не по запросу
 * на карточку. Порог minOrderTotal здесь не применяется — корзины ещё нет.
 */
export async function getMenuPrices(
  items: MenuItem[],
  now: Date = new Date(),
): Promise<Record<string, PriceResult>> {
  const promotions = await getDishPromotions(now);
  const prices: Record<string, PriceResult> = {};

  for (const item of items) {
    if (item.price == null) continue;
    prices[item.id] = computePrice(
      { id: item.id, categoryId: item.categoryId, price: item.price },
      now,
      promotions,
    );
  }

  return prices;
}