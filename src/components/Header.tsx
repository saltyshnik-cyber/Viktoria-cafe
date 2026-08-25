"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartIndicator from "@/components/CartIndicator";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-gold/10 bg-char/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="font-serif text-xl font-extrabold tracking-tight text-parchment-light"
        >
          Виктория<span className="text-gold">.</span>
        </Link>

        {isHome ? (
          <a
            href="tel:+79235700588"
            className="inline-flex items-center gap-2 rounded-sm bg-ember px-4 py-2.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 shrink-0"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="hidden sm:inline">+7 923 570-05-88</span>
            <span className="sm:hidden">Позвонить</span>
          </a>
        ) : (
          <>
            <nav className="flex items-center gap-5 text-sm font-semibold text-parchment/85 sm:gap-7">
              <Link href="/" className="hidden transition hover:text-gold sm:inline">
                Главная
              </Link>
              <Link href="/menu" className="transition hover:text-gold">
                Меню
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <a
                href="tel:+79235700588"
                className="hidden text-sm font-medium text-parchment/80 hover:text-gold sm:block"
              >
                +7 923 570-05-88
              </a>
              <CartIndicator />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
