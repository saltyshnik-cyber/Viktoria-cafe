"use client";

import { useRef, useState } from "react";
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
  const [showSauceHint, setShowSauceHint] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const hasSauceOptions = (item.sauceOptions?.length ?? 0) > 0;
  const selectedSauce = hasSauceOptions ? sauce || undefined : undefined;
  const quantity = getQuantity(item.id, selectedSauce);
  const needsSauce = hasSauceOptions && !sauce;

  const selectClassName = `w-full rounded-full border bg-parchment-light text-char outline-none transition ${
    size === "lg" ? "px-4 py-2.5 text-sm" : "mt-1 px-3 py-1.5 text-xs"
  } ${showSauceHint ? "border-red-400 ring-2 ring-red-200" : "border-gold/30 focus:border-ember"}`;

  const buttonClassName = `w-full rounded-full font-semibold transition ${
    size === "lg" ? "py-3 text-sm" : "py-1.5 text-xs"
  } ${
    needsSauce
      ? "cursor-pointer bg-ember/40 text-parchment-light/80"
      : "bg-ember text-parchment-light hover:bg-ember-light"
  }`;

  function handleAddClick() {
    if (needsSauce) {
      setShowSauceHint(true);
      selectRef.current?.focus();
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price,
      weight: item.weight,
      sauce: selectedSauce,
    });
  }

  return (
    <div>
      {hasSauceOptions && (
        <div>
          <span className="text-xs font-medium text-ink/70">
            Соус <span className="text-red-500">*</span>
          </span>
          <select
            ref={selectRef}
            value={sauce}
            onChange={(e) => {
              setSauce(e.target.value);
              if (e.target.value) setShowSauceHint(false);
            }}
            className={selectClassName}
          >
            <option value="">Выберите соус</option>
            {item.sauceOptions!.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {showSauceHint && (
            <p className="mt-1 text-xs font-medium text-red-500">Выберите соус</p>
          )}
        </div>
      )}

      <div className="mt-2">
        {quantity === 0 ? (
          <button
            type="button"
            aria-disabled={needsSauce}
            onClick={handleAddClick}
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
