"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import AddToCartControl from "@/components/AddToCartControl";
import MenuItemModal from "@/components/MenuItemModal";
import {
  MAX_VISIBLE_COMPONENTS,
  descriptionDuplicatesComposition,
  pluralizePositions,
} from "@/lib/menuDisplay";

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (item.price == null) {
    return null;
  }
  const price = item.price;

  const composition = item.composition ?? [];
  const visibleComponents = composition.slice(0, MAX_VISIBLE_COMPONENTS);
  const hiddenComponentsCount = composition.length - visibleComponents.length;
  const hideDescription = descriptionDuplicatesComposition(item.description, item.composition);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gold/20 bg-parchment-light transition hover:shadow-lg hover:shadow-black/30">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Подробнее о блюде «${item.name}»`}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className="flex flex-1 cursor-pointer flex-col text-left"
      >
        <div className="relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-warm text-3xl">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            "🍽️"
          )}
          {item.isPopular && (
            <span className="absolute left-2 top-2 rounded-full bg-ember px-2 py-0.5 text-[10px] font-semibold text-parchment-light shadow">
              Хит
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3 pb-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-char">{item.name}</h3>

          {!hideDescription && item.description && (
            <p className="line-clamp-2 text-xs text-ink/60">{item.description}</p>
          )}

          {visibleComponents.length > 0 && (
            <ul className="list-inside list-disc text-xs text-ink/60">
              {visibleComponents.map((component, index) => (
                <li key={index}>
                  {component.name}
                  {component.quantity > 1 ? ` × ${component.quantity}` : ""}
                </li>
              ))}
            </ul>
          )}
          {hiddenComponentsCount > 0 && (
            <p className="text-xs font-medium text-ember">
              + ещё {hiddenComponentsCount} {pluralizePositions(hiddenComponentsCount)}
            </p>
          )}

          <div className="mt-auto flex items-center pt-2">
            {item.weight && <span className="text-xs text-ink/50">{item.weight}</span>}
            <span className="ml-auto text-lg font-bold text-char">{price} ₽</span>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
        <AddToCartControl item={item} price={price} size="sm" />
      </div>

      {isModalOpen && (
        <MenuItemModal item={item} price={price} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
