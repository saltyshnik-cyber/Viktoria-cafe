import { calculateOrderTotals } from "@/lib/orderPricing";
import { isPromotionActive, priceCartLines, roundMoney, sumLines } from "@/lib/pricing";
import type { CartLineInput, PricedLine } from "@/lib/pricing";
import { getDishPromotions } from "@/lib/promotions-store";
import type { DeliveryType } from "@/types/order";
import type { Promotion } from "@/types/promotions";

export type CartTotals = {
  /** Сумма по прайсу, до скидок. */
  base: number;
  /** Скидки на блюда. */
  itemsDiscount: number;
  /** Сумма после скидок на блюда. */
  subtotal: number;
  /** Скидки уровня заказа: промокод, «от суммы». */
  orderDiscount: number;
  deliveryFee: number;
  total: number;
  freeDelivery: boolean;
  appliedPromotionIds: number[];
};

export type CartPricingResult = {
  lines: PricedLine[];
  totals: CartTotals;
};

export type CartPricingOptions = {
  deliveryType: DeliveryType;
  deliveryCost: number;
  now?: Date;
  promoCode?: string;
};

type OrderLevelDiscount = {
  discount: number;
  freeDelivery: boolean;
  appliedPromotionIds: number[];
};

/**
 * Скидки уровня заказа. Промокод и «от суммы» считаются от subtotal —
 * суммы, которую гость реально платит за блюда.
 *
 * second_gift сюда не входит: «второе в подарок» требует выбора конкретной
 * позиции, это решение принимает гость на оформлении, а не автосчётчик.
 */
function getOrderLevelDiscount(
  promotions: Promotion[],
  subtotal: number,
  now: Date,
  promoCode: string,
): OrderLevelDiscount {
  let discount = 0;
  let freeDelivery = false;
  const appliedPromotionIds: number[] = [];

  for (const promotion of promotions) {
    if (!isPromotionActive(promotion, now)) continue;
    if (promotion.minOrderTotal > subtotal) continue;

    if (promotion.kind === "free_delivery") {
      freeDelivery = true;
      appliedPromotionIds.push(promotion.id);
      continue;
    }

    if (promotion.kind === "promo_code") {
      if (!promoCode || promotion.slug.toLowerCase() !== promoCode) continue;
    } else if (promotion.kind !== "order_total") {
      continue;
    }

    let amount = subtotal * (promotion.value / 100);
    if (promotion.maxDiscount !== null) {
      amount = Math.min(amount, promotion.maxDiscount);
    }

    discount += roundMoney(Math.min(amount, subtotal));
    appliedPromotionIds.push(promotion.id);
  }

  return {
    discount: roundMoney(Math.min(discount, subtotal)),
    freeDelivery,
    appliedPromotionIds,
  };
}

/**
 * Единая точка расчёта денег корзины и заказа. Цены блюд берёт тот, кто
 * вызывает: на сервере это всегда цены из базы, из тела запроса — никогда.
 *
 * Порог минимальной суммы доставки сверяется с subtotal — суммой после
 * скидок на блюда, то есть с тем, что гость платит за еду.
 */
export async function getCartPricing(
  lines: CartLineInput[],
  options: CartPricingOptions,
): Promise<CartPricingResult> {
  const now = options.now ?? new Date();
  const promotions = await getDishPromotions(now);

  const pricedLines = priceCartLines(lines, now, promotions);
  const { base, subtotal, itemsDiscount } = sumLines(pricedLines);

  const orderLevel = getOrderLevelDiscount(
    promotions,
    subtotal,
    now,
    (options.promoCode ?? "").trim().toLowerCase(),
  );

  const deliveryFee = orderLevel.freeDelivery
    ? 0
    : calculateOrderTotals(subtotal, options.deliveryType, options.deliveryCost).deliveryFee;

  return {
    lines: pricedLines,
    totals: {
      base,
      itemsDiscount,
      subtotal,
      orderDiscount: orderLevel.discount,
      deliveryFee,
      total: roundMoney(Math.max(0, subtotal - orderLevel.discount) + deliveryFee),
      freeDelivery: orderLevel.freeDelivery,
      appliedPromotionIds: orderLevel.appliedPromotionIds,
    },
  };
}