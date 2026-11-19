"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/QuantityStepper";

type PricedLine = {
  key: string;
  id: string;
  sauce: string;
  quantity: number;
  basePrice: number;
  price: number;
  lineTotal: number;
  baseLineTotal: number;
  discount: number;
  promotionId: number | null;
  badge: string | null;
  label: string | null;
};

type CartTotals = {
  base: number;
  itemsDiscount: number;
  subtotal: number;
  orderDiscount: number;
  deliveryFee: number;
  total: number;
  freeDelivery: boolean;
};

type PricingResponse = {
  lines: PricedLine[];
  totals: CartTotals;
  unavailable: string[];
  deliveryThreshold: number;
  deliveryCost: number;
};

const moneyFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

function money(value: number): string {
  return `${moneyFormat.format(value)} ₽`;
}

function cartKey(id: string, sauce?: string): string {
  return `${id}::${sauce ?? ""}`;
}

export default function CartView({
  deliveryThreshold,
  deliveryCost,
}: {
  deliveryThreshold: number;
  deliveryCost: number;
}) {
  const { items, totalItems, setQuantity, removeItem, clearCart } = useCart();
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  // Состав корзины строкой: эффект перезапускается только при реальном
  // изменении блюд или количества, а не на каждый рендер.
  const signature = items
    .map((item) => `${cartKey(item.id, item.sauce)}x${item.quantity}`)
    .join("|");

  useEffect(() => {
    if (items.length === 0) {
      setPricing(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/cart/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          sauce: item.sauce,
        })),
      }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: PricingResponse) => setPricing(data))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Оставляем прошлые цены: показать неверные хуже, чем показать устаревшие.
      });

    return () => controller.abort();
    // items нужен только как источник состава — зависимость описана сигнатурой.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const linesByKey = useMemo(() => {
    const map = new Map<string, PricedLine>();
    for (const line of pricing?.lines ?? []) map.set(line.key, line);
    return map;
  }, [pricing]);

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-char">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Link
            href="/menu"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-parchment/70 transition hover:text-gold"
          >
            ← Назад в меню
          </Link>
          <h1 className="text-2xl font-bold text-parchment-light">Корзина пуста</h1>
          <p className="mt-2 text-parchment/60">
            Загляните в меню и выберите что-нибудь вкусное.
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-block rounded-full bg-ember px-5 py-2 text-sm font-semibold text-parchment-light transition hover:bg-ember-light"
          >
            Перейти к меню
          </Link>
        </div>
      </div>
    );
  }

  const threshold = pricing?.deliveryThreshold ?? deliveryThreshold;
  const cost = pricing?.deliveryCost ?? deliveryCost;
  const unavailable = new Set(pricing?.unavailable ?? []);
  const remainingForDelivery =
    pricing === null ? null : Math.max(0, threshold - pricing.totals.subtotal);

  return (
    <div className="min-h-screen bg-char">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/menu"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-parchment/70 transition hover:text-gold"
        >
          ← Назад в меню
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-parchment-light">Корзина</h1>
          <button
            type="button"
            onClick={clearCart}
            className="text-sm text-parchment/50 hover:text-gold"
          >
            Очистить
          </button>
        </div>

        <ul className="mt-6 divide-y divide-parchment/10">
          {items.map((item) => {
            const isUnavailable = unavailable.has(item.id);
            const line = linesByKey.get(cartKey(item.id, item.sauce));
            const hasDiscount = Boolean(line && line.discount > 0 && line.price < line.basePrice);

            return (
              <li key={cartKey(item.id, item.sauce)} className="flex items-center gap-4 py-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-parchment-light text-2xl">
                  🍽️
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-parchment-light">{item.name}</div>
                  <div className="text-sm text-parchment/50">
                    {[item.weight, item.sauce && `Соус: ${item.sauce}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>

                  {isUnavailable && (
                    <div className="mt-1 text-sm font-semibold text-ember">
                      Сейчас недоступно — уберите из корзины
                    </div>
                  )}

                  {hasDiscount && line?.badge && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-parchment/40 line-through">
                        {money(line.basePrice)}
                      </span>
                      <span className="font-semibold text-gold">{money(line.price)}</span>
                      <span className="rounded-full bg-ember px-2 py-0.5 text-[11px] font-semibold text-parchment-light">
                        {line.badge}
                      </span>
                    </div>
                  )}

                  {hasDiscount && line?.label && (
                    <div className="mt-1 text-xs text-gold/80">{line.label}</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-semibold text-parchment-light">
                    {line ? money(line.lineTotal) : "…"}
                  </div>
                  {hasDiscount && line && (
                    <div className="text-xs text-parchment/40 line-through">
                      {money(line.baseLineTotal)}
                    </div>
                  )}
                </div>

                <QuantityStepper
                  quantity={item.quantity}
                  onChange={(next) => setQuantity(item.id, next, item.sauce)}
                />

                <button
                  type="button"
                  aria-label={`Удалить «${item.name}» из корзины`}
                  onClick={() => removeItem(item.id, item.sauce)}
                  className="text-parchment/30 hover:text-gold"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>

        {remainingForDelivery !== null && remainingForDelivery > 0 && (
          <p className="mt-4 rounded-lg bg-parchment/10 px-4 py-3 text-sm text-parchment/70">
            Для доставки добавьте ещё на {money(remainingForDelivery)} — доставка от{" "}
            {money(threshold)}. Самовывоз доступен без минимальной суммы.
          </p>
        )}

        {remainingForDelivery === 0 && (
          <p className="mt-4 rounded-lg bg-gold/15 px-4 py-3 text-sm text-gold">
            Сумма заказа позволяет оформить доставку
            {cost > 0 && ` (стоимость доставки ${money(cost)})`}
          </p>
        )}

        <div className="mt-6 space-y-2 border-t border-parchment/10 pt-4">
          <div className="flex items-center justify-between text-parchment/60">
            <span>Сумма блюд</span>
            <span>{pricing ? money(pricing.totals.base) : "…"}</span>
          </div>

          {pricing && pricing.totals.itemsDiscount > 0 && (
            <div className="flex items-center justify-between text-gold">
              <span>Скидки по акциям</span>
              <span>−{money(pricing.totals.itemsDiscount)}</span>
            </div>
          )}

          {pricing && pricing.totals.orderDiscount > 0 && (
            <div className="flex items-center justify-between text-gold">
              <span>Скидка на заказ</span>
              <span>−{money(pricing.totals.orderDiscount)}</span>
            </div>
          )}

          {pricing && (
            <div className="flex items-center justify-between text-parchment/60">
              <span>Доставка</span>
              <span>
                {pricing.totals.deliveryFee === 0
                  ? "Бесплатно"
                  : money(pricing.totals.deliveryFee)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-parchment/60">Итого</span>
            <span className="text-xl font-bold text-parchment-light">
              {pricing ? money(pricing.totals.total) : "…"}
            </span>
          </div>
        </div>

        <Link
          href="/checkout"
          className="mt-6 block w-full rounded-full bg-ember py-3 text-center text-sm font-semibold text-parchment-light transition hover:bg-ember-light"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}