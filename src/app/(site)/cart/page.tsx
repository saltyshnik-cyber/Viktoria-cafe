"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/QuantityStepper";

const DELIVERY_THRESHOLD = 500;

export default function CartPage() {
  const { items, totalItems, totalPrice, setQuantity, removeItem, clearCart } =
    useCart();

  if (totalItems === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Корзина пуста</h1>
        <p className="mt-2 text-ink/60">
          Загляните в меню и выберите что-нибудь вкусное.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream hover:bg-primary-dark"
        >
          Перейти к меню
        </Link>
      </div>
    );
  }

  const remainingForDelivery = Math.max(0, DELIVERY_THRESHOLD - totalPrice);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Корзина</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-ink/50 hover:text-primary"
        >
          Очистить
        </button>
      </div>

      <ul className="mt-6 divide-y divide-black/5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cream text-2xl">
              🍽️
            </div>

            <div className="flex-1">
              <div className="font-semibold text-ink">{item.name}</div>
              <div className="text-sm text-ink/50">{item.weight}</div>
            </div>

            <div className="font-semibold text-ink">
              {item.price * item.quantity} ₽
            </div>

            <QuantityStepper
              quantity={item.quantity}
              onChange={(next) => setQuantity(item.id, next)}
            />

            <button
              type="button"
              aria-label={`Удалить «${item.name}» из корзины`}
              onClick={() => removeItem(item.id)}
              className="text-ink/30 hover:text-primary"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {remainingForDelivery > 0 ? (
        <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-sm text-ink/70">
          Добавьте ещё на {remainingForDelivery} ₽ — доставка от{" "}
          {DELIVERY_THRESHOLD} ₽
        </p>
      ) : (
        <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
          Сумма заказа позволяет оформить доставку
        </p>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
        <span className="text-ink/60">Итого</span>
        <span className="text-xl font-bold text-ink">{totalPrice} ₽</span>
      </div>

      {remainingForDelivery > 0 ? (
        <button
          type="button"
          disabled
          className="mt-6 w-full cursor-not-allowed rounded-full bg-primary py-3 text-sm font-semibold text-cream opacity-40"
        >
          Оформить заказ
        </button>
      ) : (
        <Link
          href="/checkout"
          className="mt-6 block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-cream transition hover:bg-primary-dark"
        >
          Оформить заказ
        </Link>
      )}
    </div>
  );
}
