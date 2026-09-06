"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/QuantityStepper";

export default function AddToCartControl({
  item,
  price,
  size = "sm",
}: {
  item: MenuItem;
  price: number;
  /** "sm" — компактная карточка в списке, "lg" — модальное окно с деталями. */
  size?: "sm" | "lg";
}) {
  const { getQuantity, addItem, setQuantity } = useCart();
  const [sauce, setSauce] = useState("");
  const hasSauceOptions = (item.sauceOptions?.length ?? 0) > 0;
  const selectedSauce = hasSauceOptions ? sauce || undefined : undefined;
  const quantity = getQuantity(item.id, selectedSauce);

  const selectClassName =
    size === "lg"
      ? "w-full rounded-full border border-gold/30 bg-parchment-light px-4 py-2.5 text-sm text-char outline-none focus:border-ember"
      : "mt-2 w-full rounded-full border border-gold/30 bg-parchment-light px-3 py-1.5 text-xs text-char outline-none focus:border-ember";

  const buttonClassName =
    size === "lg"
      ? "w-full rounded-full bg-ember py-3 text-sm font-semibold text-parchment-light transition hover:bg-ember-light disabled:cursor-not-allowed disabled:opacity-40"
      : "w-full rounded-full bg-ember py-1.5 text-xs font-semibold text-parchment-light transition hover:bg-ember-light disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div>
      {hasSauceOptions && (
        <select
          value={sauce}
          onChange={(e) => setSauce(e.target.value)}
          className={selectClassName}
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
            className={buttonClassName}
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
  );
}
