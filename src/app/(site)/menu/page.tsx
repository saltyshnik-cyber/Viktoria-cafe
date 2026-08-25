import Link from "next/link";
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
    <div className="min-h-screen bg-char">
      <section className="bg-char">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-parchment/70 transition hover:text-gold"
          >
            ← Назад на главную
          </Link>
          <h1 className="max-w-xl text-3xl font-bold text-parchment-light sm:text-4xl">
            Меню кафе «Виктория»
          </h1>
          <p className="mt-3 max-w-lg text-parchment/70">
            Шашлык, хачапури и грузинская кухня на углях. Готовим каждый день —
            с 11:00 до полуночи.
          </p>
        </div>
      </section>

      <CategoryNav />

      <div className="mx-auto max-w-6xl divide-y divide-parchment/10 px-4 pb-12">
        {categories.map((category) => (
          <MenuSection
            key={category.id}
            category={category}
            items={items.filter((item) => item.categoryId === category.id)}
          />
        ))}
      </div>
    </div>
  );
}
