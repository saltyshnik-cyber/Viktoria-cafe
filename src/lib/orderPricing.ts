import type { DeliveryType } from "@/types/order";

// Чистая арифметика заказа — одна и та же на клиенте (чекаут) и на сервере
// (создание заказа), чтобы показанная сумма совпадала с сохранённой.

export type OrderTotals = {
  itemsTotal: number;
  deliveryFee: number;
  total: number;
};

/** Доставка платная только при доставке; самовывоз — всегда 0. */
export function getDeliveryFee(deliveryType: DeliveryType, deliveryCost: number): number {
  if (deliveryType !== "delivery") return 0;
  return Number.isFinite(deliveryCost) && deliveryCost > 0 ? Math.round(deliveryCost) : 0;
}

/**
 * Сколько ₽ блюд не хватает до минимальной суммы доставки (0 — условие
 * выполнено или не применяется). Порог — это минимум для доставки, а не
 * порог бесплатной доставки; самовывоз его не касается. Сравнивается
 * сумма блюд, без стоимости доставки.
 */
export function getDeliveryShortfall(
  itemsTotal: number,
  deliveryType: DeliveryType,
  deliveryThreshold: number,
): number {
  if (deliveryType !== "delivery") return 0;
  if (!Number.isFinite(deliveryThreshold) || deliveryThreshold <= 0) return 0;
  return Math.max(0, Math.round(deliveryThreshold) - itemsTotal);
}

export function deliveryMinimumMessage(deliveryThreshold: number, shortfall: number): string {
  return `Минимальная сумма заказа для доставки — ${Math.round(deliveryThreshold)} ₽. Добавьте ещё на ${shortfall} ₽ или выберите самовывоз.`;
}

export function sumItems(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateOrderTotals(
  itemsTotal: number,
  deliveryType: DeliveryType,
  deliveryCost: number,
): OrderTotals {
  const deliveryFee = getDeliveryFee(deliveryType, deliveryCost);
  return { itemsTotal, deliveryFee, total: itemsTotal + deliveryFee };
}
