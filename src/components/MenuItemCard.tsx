"use client";

import type { MenuItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/QuantityStepper";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { getQuantity, addItem, setQuantity } = useCart();
  const quantity = getQuantity(item.id);

  return (
    <div className="flex flex-col rounded-xl2 border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-cream text-4xl">
        🍽️
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-ink">{item.name}</h3>
        {item.isPopular && (
          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Хит
          </span>
        )}
      </div>

      <p className="mt-1 flex-1 text-sm text-ink/60">{item.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-ink/50">{item.weight}</div>
        <div className="font-semibold text-ink">{item.price} ₽</div>
      </div>

      <div className="mt-3">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={() =>
              addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                weight: item.weight,
              })
            }
            className="w-full rounded-full bg-primary/10 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
          >
            В корзину
          </button>
        ) : (
          <QuantityStepper
            quantity={quantity}
            onChange={(next) => setQuantity(item.id, next)}
          />
        )}
      </div>
    </div>
  );
}
