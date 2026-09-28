"use client";

import { useState } from "react";
import type { MenuCategory, MenuItem } from "@/types/menu";
import MenuItemCard from "@/components/MenuItemCard";

export default function MenuSection({
  category,
  items,
}: {
  category: MenuCategory;
  items: MenuItem[];
}) {
  // Раскрытой может быть только одна карточка состава в пределах категории —
  // при раскрытии другой предыдущая сворачивается сама.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section id={category.id} className="min-w-0 scroll-mt-32 py-8">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-parchment-light">
        <span>{category.emoji}</span>
        {category.name}
      </h2>

      <div className="flex flex-nowrap items-start snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[85vw] max-w-xs shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <MenuItemCard
              item={item}
              isCompositionExpanded={expandedId === item.id}
              onToggleComposition={() =>
                setExpandedId((current) => (current === item.id ? null : item.id))
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
