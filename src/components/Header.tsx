"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartIndicator from "@/components/CartIndicator";
import { phoneToTelHref } from "@/lib/phone";

export default function Header({ phone }: { phone: string }) {
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
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-sm bg-ember px-4 py-2.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
          >
            Сделать заказ
          </Link>
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
                href={phoneToTelHref(phone)}
                className="hidden text-sm font-medium text-parchment/80 hover:text-gold sm:block"
              >
                {phone}
              </a>
              <CartIndicator />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
