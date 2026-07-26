import Link from "next/link";
import { categories } from "@/data/menu";
import CartIndicator from "@/components/CartIndicator";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-cream">
            В
          </span>
          <span className="text-lg font-bold text-ink">Виктория</span>
        </Link>

        <a
          href="tel:+70000000000"
          className="hidden text-sm font-medium text-ink/80 hover:text-primary sm:block"
        >
          +7 (000) 000-00-00
        </a>

        <CartIndicator />
      </div>

      <nav className="scrollbar-none mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 text-sm">
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-ink/70 transition hover:border-primary hover:text-primary"
          >
            {category.emoji} {category.name}
          </a>
        ))}
      </nav>
    </header>
  );
}
