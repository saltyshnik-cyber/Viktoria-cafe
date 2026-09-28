"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/menu";
import AddToCartControl from "@/components/AddToCartControl";
import MenuItemModal from "@/components/MenuItemModal";
import { MAX_PREVIEW_COMPONENTS, descriptionDuplicatesComposition } from "@/lib/menuDisplay";

export default function MenuItemCard({
  item,
  isCompositionExpanded = false,
  onToggleComposition,
}: {
  item: MenuItem;
  /** Раскрыт ли полный состав — управляется родителем (общее для всей ленты). */
  isCompositionExpanded?: boolean;
  onToggleComposition?: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (item.price == null) {
    return null;
  }
  const price = item.price;

  const composition = item.composition ?? [];
  const hasComposition = composition.length > 0;
  const previewComponents = composition.slice(0, MAX_PREVIEW_COMPONENTS);
  const canExpandComposition = composition.length > MAX_PREVIEW_COMPONENTS;
  const hideDescription = descriptionDuplicatesComposition(item.description, item.composition);

  function openModal() {
    setIsModalOpen(true);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gold/20 bg-parchment-light transition hover:shadow-lg hover:shadow-black/30">
      <button
        type="button"
        onClick={openModal}
        aria-label={`Подробнее о блюде «${item.name}»`}
        className="flex flex-col text-left"
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-warm">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">🍽️</div>
          )}
          {item.isPopular && (
            <span className="absolute left-2 top-2 rounded-full bg-ember px-2 py-0.5 text-[10px] font-semibold text-parchment-light shadow">
              Хит
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] px-3 pt-3 text-sm font-semibold text-char">
          {item.name}
        </h3>
      </button>

      <div className="flex flex-1 flex-col gap-1 px-3 pb-0">
        {hasComposition ? (
          <>
            <ul className="min-h-[3.75rem] list-inside list-disc text-xs text-ink/60">
              {previewComponents.map((component, index) => (
                <li key={index}>
                  {component.name}
                  {component.quantity > 1 ? ` × ${component.quantity}` : ""}
                </li>
              ))}
            </ul>

            <div className="h-6">
              {canExpandComposition && (
                <button
                  type="button"
                  onClick={onToggleComposition}
                  className="text-xs font-medium text-ember hover:underline"
                >
                  {isCompositionExpanded ? "▴ Свернуть" : "▾ Состав"}
                </button>
              )}
            </div>

            <div
              className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: isCompositionExpanded ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <ul className="list-inside list-disc pb-2 text-xs text-ink/60">
                  {composition.map((component, index) => (
                    <li key={index}>
                      {component.name}
                      {component.quantity > 1 ? ` × ${component.quantity}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          !hideDescription &&
          item.description && (
            <p className="line-clamp-2 text-xs text-ink/60">{item.description}</p>
          )
        )}

        <div className="mt-auto flex items-center pt-2">
          {item.weight && <span className="text-xs text-ink/50">{item.weight}</span>}
          <span className="ml-auto text-lg font-bold text-char">{price} ₽</span>
        </div>
      </div>

      <div className="p-3 pt-2">
        <AddToCartControl item={item} price={price} size="sm" />
      </div>

      {isModalOpen && (
        <MenuItemModal item={item} price={price} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
