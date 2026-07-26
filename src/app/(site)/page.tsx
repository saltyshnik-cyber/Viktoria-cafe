import { categories, getItemsByCategory } from "@/data/menu";
import MenuSection from "@/components/MenuSection";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <section className="bg-primary/5">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-xl text-3xl font-bold text-ink sm:text-4xl">
            Домашняя кухня «Виктория» с доставкой на дом
          </h1>
          <p className="mt-3 max-w-lg text-ink/70">
            Готовим из свежих продуктов каждый день. Доставим горячим за 40–60 минут
            в любую точку города.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl divide-y divide-black/5 px-4">
        {categories.map((category) => (
          <MenuSection
            key={category.id}
            category={category}
            items={getItemsByCategory(category.id)}
          />
        ))}
      </div>
    </>
  );
}
