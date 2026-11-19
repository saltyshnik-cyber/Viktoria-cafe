"use client";

import { useEffect, useRef, useState } from "react";
import type { DeliveryType } from "@/types/order";

// Формы ответа /api/cart/price. Деньги приходят в snake_case — так они же
// лежат в orders.items (jsonb), поэтому перевод в camelCase делается только
// на границе базы, а не в браузере.

export type PricedLine = {
  id: string;
  name: string;
  sauce: string;
  quantity: number;
  base_price: number;
  final_price: number;
  discount_amount: number;
  promotion_id: number | null;
  line_total: number;
  base_line_total: number;
  badge: string | null;
  label: string | null;
};

export type CartPricing = {
  lines: PricedLine[];
  totals: {
    base: number;
    discount: number;
    subtotal: number;
    delivery: number;
    total: number;
  };
  unavailable: string[];
  deliveryThreshold: number;
  deliveryCost: number;
  deliveryShortfall: number;
};

export type CartLineRef = { id: string; quantity: number; sauce?: string };

export function cartLineKey(id: string, sauce?: string | null): string {
  return `${id}::${sauce ?? ""}`;
}

/**
 * Единственное место, где браузер спрашивает цены. Отправляет только состав —
 * id, количество и соус; ни цена, ни сумма клиентом не передаются.
 */
export function useCartPricing(
  lines: CartLineRef[],
  deliveryType: DeliveryType = "delivery",
): CartPricing | null {
  const [pricing, setPricing] = useState<CartPricing | null>(null);

  // Состав строкой: эффект перезапускается только при реальном изменении
  // блюд или количества, а не на каждый рендер нового массива.
  const signature = JSON.stringify(
    lines.map((line) => [line.id, line.quantity, line.sauce ?? ""]),
  );

  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    const items = linesRef.current.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      sauce: line.sauce ?? "",
    }));

    if (items.length === 0) {
      setPricing(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, deliveryType }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: CartPricing) => setPricing(data))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Оставляем прошлые цены: показать устаревшие честнее, чем неверные.
      });

    return () => controller.abort();
  }, [signature, deliveryType]);

  return pricing;
}