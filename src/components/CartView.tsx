"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/QuantityStepper";

export default function CartView({
  deliveryThreshold,
  deliveryCost,
}: {
  deliveryThreshold: number;
  deliveryCost: number;
}) {
  const { items, totalItems, totalPrice, setQuantity, removeItem, clearCart } =
    useCart();

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

  const remainingForDelivery = Math.max(0, deliveryThreshold - totalPrice);

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
          {items.map((item) => (
            <li key={`${item.id}::${item.sauce ?? ""}`} className="flex items-center gap-4 py-4">
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
              </div>

              <div className="font-semibold text-parchment-light">
                {item.price * item.quantity} ₽
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
          ))}
        </ul>

        {remainingForDelivery > 0 ? (
          <p className="mt-4 rounded-lg bg-parchment/10 px-4 py-3 text-sm text-parchment/70">
            Для доставки добавьте ещё на {remainingForDelivery} ₽ — доставка от{" "}
            {deliveryThreshold} ₽. Самовывоз доступен без минимальной суммы.
          </p>
        ) : (
          <p className="mt-4 rounded-lg bg-gold/15 px-4 py-3 text-sm text-gold">
            Сумма заказа позволяет оформить доставку
            {deliveryCost > 0 && ` (стоимость доставки ${deliveryCost} ₽)`}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-parchment/10 pt-4">
          <span className="text-parchment/60">Сумма блюд</span>
          <span className="text-xl font-bold text-parchment-light">{totalPrice} ₽</span>
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
