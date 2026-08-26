"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      pathname === href
        ? "bg-primary text-cream"
        : "text-ink/60 hover:text-primary"
    }`;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders" className={linkClass("/admin/orders")}>
          Заказы
        </Link>
        <Link href="/admin/menu" className={linkClass("/admin/menu")}>
          Меню
        </Link>
        <Link href="/admin/categories" className={linkClass("/admin/categories")}>
          Категории
        </Link>
        <Link href="/admin/homepage" className={linkClass("/admin/homepage")}>
          Главная
        </Link>
        <Link href="/admin/contacts" className={linkClass("/admin/contacts")}>
          Контакты
        </Link>
        <Link href="/admin/delivery" className={linkClass("/admin/delivery")}>
          Доставка
        </Link>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-ink/50 hover:text-primary"
      >
        Выйти
      </button>
    </nav>
  );
}
