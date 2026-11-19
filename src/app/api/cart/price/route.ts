import { NextResponse } from "next/server";
import { getDeliveryShortfall } from "@/lib/orderPricing";
import { priceCart } from "@/lib/pricing-server";
import type { CartLineRequest } from "@/lib/pricing-server";
import { getSiteSettings } from "@/lib/siteSettings";

const MAX_ITEM_QUANTITY = 99;
const MAX_CART_LINES = 50;

// Публичный расчёт корзины. Тело содержит только состав: id блюда, количество
// и соус. Ни цены, ни суммы из него не читаются — иначе скидку можно было бы
// подделать запросом.
type CartRequestBody = {
  items?: unknown;
  deliveryType?: unknown;
};

export async function POST(request: Request) {
  let body: CartRequestBody;
  try {
    body = (await request.json()) as CartRequestBody;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }
  if (rawItems.length > MAX_CART_LINES) {
    return NextResponse.json({ error: "Слишком много позиций в корзине" }, { status: 400 });
  }

  const lines: CartLineRequest[] = [];

  for (const raw of rawItems) {
    const candidate = (raw ?? {}) as { id?: unknown; quantity?: unknown; sauce?: unknown };
    const id = typeof candidate.id === "string" ? candidate.id : "";
    const quantity = typeof candidate.quantity === "number" ? candidate.quantity : 0;
    const sauce =
      typeof candidate.sauce === "string" ? candidate.sauce.trim().slice(0, 100) : "";

    if (!id) {
      return NextResponse.json({ error: "Некорректный состав корзины" }, { status: 400 });
    }
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      return NextResponse.json({ error: "Некорректное количество блюда" }, { status: 400 });
    }

    lines.push({ id, quantity, sauce: sauce || undefined });
  }

  const deliveryType = body.deliveryType === "pickup" ? "pickup" : "delivery";
  const settings = await getSiteSettings();
  const result = await priceCart(lines, {
    deliveryType,
    deliveryCost: settings.deliveryCost,
  });

  return NextResponse.json({
    lines: result.lines,
    totals: result.totals,
    unavailable: result.unavailable,
    deliveryThreshold: settings.deliveryThreshold,
    deliveryCost: settings.deliveryCost,
    deliveryShortfall: getDeliveryShortfall(
      result.totals.subtotal,
      deliveryType,
      settings.deliveryThreshold,
    ),
  });
}