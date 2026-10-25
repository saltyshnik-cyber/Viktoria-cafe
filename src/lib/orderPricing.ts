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
