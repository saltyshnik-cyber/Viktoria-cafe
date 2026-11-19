import { calculateOrderTotals } from "@/lib/orderPricing";
import { computePrice, priceCartLines, roundMoney, sumLines } from "@/lib/pricing";
import type { CartLineInput, PriceResult } from "@/lib/pricing";
import { getDishPromotions } from "@/lib/promotions-store";
import { getMenuItemsByIds } from "@/lib/menu-store";
import type { DeliveryType } from "@/types/order";

// Серверный модуль расчёта цен. Его нельзя импортировать из компонента с
// "use client": клиент получает готовые числа только через /api/cart/price,
// иначе цены снова начнут считаться в браузере.

export type DishRef = {
  id: string;
  categoryId: string;
  price: number | null;
};

/** Денежные поля позиции — ровно те ключи, что пишутся в orders.items (jsonb). */
export type PricedItemLine = {
  id: string;
  sauce: string;
  quantity: number;
  base_price: number;
  final_price: number;
  discount_amount: number;
  promotion_id: number | null;
  /** final_price × quantity, посчитано сервером. */
  line_total: number;
  base_line_total: number;
  badge: string | null;
  label: string | null;
};

export type CartTotals = {
  /** Сумма по прайсу, до скидок. */
  base: number;
  /** Скидки на блюда. */
  discount: number;
  /** base − discount: столько гость платит за еду. */
  subtotal: number;
  delivery: number;
  /** subtotal + delivery. */
  total: number;
};

export type CartLineRequest = {
  id: string;
  quantity: number;
  sauce?: string;
};

export type CartPricingOptions = {
  deliveryType: DeliveryType;
  deliveryCost: number;
  now?: Date;
};

export type CartPricingResult = {
  lines: PricedItemLine[];
  totals: CartTotals;
  /** id блюд, которых нет в меню, нет в наличии или у которых не задана цена. */
  unavailable: string[];
};

/**
 * Цены на набор блюд: акции читаются одним запросом, а не по запросу на
 * карточку. Порог minOrderTotal здесь не применяется — корзины ещё нет,
 * поэтому в меню акция «от суммы» показывается как потенциальная.
 */
export async function getMenuPrices(
  dishes: DishRef[],
  now: Date = new Date(),
): Promise<Record<string, PriceResult>> {
  const priced = dishes.filter((dish) => dish.price != null);
  if (priced.length === 0) return {};

  const promotions = await getDishPromotions(now);
  const prices: Record<string, PriceResult> = {};

  for (const dish of priced) {
    prices[dish.id] = computePrice(
      { id: dish.id, categoryId: dish.categoryId, price: dish.price as number },
      now,
      promotions,
    );
  }

  return prices;
}

/**
 * Цены корзины. Берёт блюда и их цены из базы: всё, что клиент мог прислать
 * про деньги, игнорируется полностью. Тот же расчёт использует /api/orders,
 * поэтому сумма в заказе совпадает с ответом этого эндпоинта до копейки.
 */
export async function priceCart(
  lines: CartLineRequest[],
  options: CartPricingOptions,
): Promise<CartPricingResult> {
  const emptyTotals: CartTotals = { base: 0, discount: 0, subtotal: 0, delivery: 0, total: 0 };
  const ids = [...new Set(lines.map((line) => line.id))];
  if (ids.length === 0) {
    return { lines: [], totals: emptyTotals, unavailable: [] };
  }

  const now = options.now ?? new Date();
  const menuById = new Map((await getMenuItemsByIds(ids)).map((item) => [item.id, item]));
  const promotions = await getDishPromotions(now);

  const cartLines: CartLineInput[] = [];
  const sauces: string[] = [];
  const unavailable: string[] = [];

  for (const line of lines) {
    const item = menuById.get(line.id);
    if (!item || item.isAvailable === false || item.price == null) {
      unavailable.push(line.id);
      continue;
    }

    cartLines.push({
      id: item.id,
      categoryId: item.categoryId ?? "",
      price: item.price,
      quantity: line.quantity,
    });
    sauces.push(line.sauce ?? "");
  }

  const priced = priceCartLines(cartLines, now, promotions);
  const { base, subtotal, itemsDiscount } = sumLines(priced);

  // Порог минимальной суммы доставки считается от subtotal — суммы после
  // скидок на блюда. minOrderTotal у акций, наоборот, от base (см. pricing.ts).
  const { deliveryFee } = calculateOrderTotals(
    subtotal,
    options.deliveryType,
    options.deliveryCost,
  );

  return {
    lines: priced.map((line, index) => ({
      id: line.id,
      sauce: sauces[index],
      quantity: line.quantity,
      base_price: line.basePrice,
      final_price: line.price,
      discount_amount: line.discount,
      promotion_id: line.promotionId,
      line_total: roundMoney(line.price * line.quantity),
      base_line_total: roundMoney(line.basePrice * line.quantity),
      badge: line.badge,
      label: line.label,
    })),
    totals: {
      base,
      discount: itemsDiscount,
      subtotal,
      delivery: deliveryFee,
      total: roundMoney(subtotal + deliveryFee),
    },
    unavailable,
  };
}