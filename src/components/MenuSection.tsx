import type { MenuCategory, MenuItem } from "@/types/menu";
import MenuItemCard from "@/components/MenuItemCard";

export default function MenuSection({
  category,
  items,
}: {
  category: MenuCategory;
  items: MenuItem[];
}) {
  return (
    <section id={category.id} className="scroll-mt-32 py-8">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-ink">
        <span>{category.emoji}</span>
        {category.name}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
