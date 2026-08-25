import { categories } from "@/data/menu";
import { getAllMenuItems } from "@/lib/menu-store";
import MenuSection from "@/components/MenuSection";
import CategoryNav from "@/components/CategoryNav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Меню — Кафе «Виктория»",
};

export default async function MenuPage() {
  const items = await getAllMenuItems();

  return (
    <>
      <section className="bg-primary/5">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-xl text-3xl font-bold text-ink sm:text-4xl">
            Меню кафе «Виктория»
          </h1>
          <p className="mt-3 max-w-lg text-ink/70">
            Шашлык, хачапури и грузинская кухня на углях. Готовим каждый день —
            с 11:00 до полуночи.
          </p>
        </div>
      </section>

      <CategoryNav />

      <div className="mx-auto max-w-6xl divide-y divide-black/5 px-4">
        {categories.map((category) => (
          <MenuSection
            key={category.id}
            category={category}
            items={items.filter((item) => item.categoryId === category.id)}
          />
        ))}
      </div>
    </>
  );
}
