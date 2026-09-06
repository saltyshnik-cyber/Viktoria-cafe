"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/QuantityStepper";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { getQuantity, addItem, setQuantity } = useCart();
  const [sauce, setSauce] = useState("");
  const hasSauceOptions = (item.sauceOptions?.length ?? 0) > 0;
  const selectedSauce = hasSauceOptions ? sauce || undefined : undefined;
  const quantity = getQuantity(item.id, selectedSauce);

  if (item.price == null) {
    return null;
  }
  const price = item.price;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gold/20 bg-parchment-light transition hover:shadow-lg hover:shadow-black/30">
      <div className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-warm text-3xl">
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          "🍽️"
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-char">{item.name}</h3>
          {item.isPopular && (
            <span className="shrink-0 rounded-full bg-ember/15 px-1.5 py-0.5 text-[10px] font-medium text-ember">
              Хит
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-xs text-ink/60">{item.description}</p>

        {item.composition && item.composition.length > 0 && (
          <ul className="list-inside list-disc text-xs text-ink/60">
            {item.composition.map((component, index) => (
              <li key={index}>
                {component.name}
                {component.quantity > 1 ? ` × ${component.quantity}` : ""}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center pt-2">
          {item.weight && <span className="text-xs text-ink/50">{item.weight}</span>}
          <span className="ml-auto font-semibold text-char">{price} ₽</span>
        </div>

        {hasSauceOptions && (
          <select
            value={sauce}
            onChange={(e) => setSauce(e.target.value)}
            className="mt-2 w-full rounded-full border border-gold/30 bg-parchment-light px-3 py-1.5 text-xs text-char outline-none focus:border-ember"
          >
            <option value="">Выберите соус</option>
            {item.sauceOptions!.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        <div className="mt-2">
          {quantity === 0 ? (
            <button
              type="button"
              disabled={hasSauceOptions && !sauce}
              onClick={() =>
                addItem({
                  id: item.id,
                  name: item.name,
                  price,
                  weight: item.weight,
                  sauce: selectedSauce,
                })
              }
              className="w-full rounded-full bg-ember py-1.5 text-xs font-semibold text-parchment-light transition hover:bg-ember-light disabled:cursor-not-allowed disabled:opacity-40"
            >
              В корзину
            </button>
          ) : (
            <QuantityStepper
              quantity={quantity}
              onChange={(next) => setQuantity(item.id, next, selectedSauce)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
