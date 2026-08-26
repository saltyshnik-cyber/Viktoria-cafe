"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/homepage", label: "Главная" },
  { href: "/admin/contacts", label: "Контакты" },
  { href: "/admin/delivery", label: "Доставка" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold text-ink/70 transition hover:text-primary"
        >
          ← На сайт
        </Link>

        <div className="h-5 w-px shrink-0 bg-black/10" />

        <div className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-primary text-cream"
                  : "text-ink/60 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-black"
        >
          Выйти
        </button>
      </div>
    </header>
  );
}
