"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartIndicator() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream transition hover:bg-primary-dark"
    >
      Корзина
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream text-xs font-bold text-primary">
        {totalItems}
      </span>
    </Link>
  );
}
