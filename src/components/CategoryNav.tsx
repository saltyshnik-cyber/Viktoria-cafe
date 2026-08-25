import { categories } from "@/data/menu";

export default function CategoryNav() {
  return (
    <nav className="scrollbar-none sticky top-16 z-30 mx-auto flex max-w-6xl gap-2 overflow-x-auto border-b border-black/5 bg-cream/95 px-4 py-3 backdrop-blur">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`#${category.id}`}
          className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-sm text-ink/70 transition hover:border-primary hover:text-primary"
        >
          {category.emoji} {category.name}
        </a>
      ))}
    </nav>
  );
}
