import { NextResponse } from "next/server";
import { getMenuItemsByIds } from "@/lib/menu-store";
import { getSiteSettings } from "@/lib/siteSettings";
import { getCartPricing } from "@/lib/cartPricing";
import { roundMoney } from "@/lib/pricing";
import type { CartLineInput } from "@/lib/pricing";

const MAX_ITEM_QUANTITY = 99;
const MAX_CART_LINES = 50;

// Публичный расчёт корзины. Клиент присылает только состав — id, количество
// и соус. Ни цены, ни суммы из тела запроса не используются.
type CartRequestBody = {
  items?: { id?: unknown; quantity?: unknown; sauce?: unknown }[];
  promoCode?: unknown;
};

function cartKey(id: string, sauce: string): string {
  return `${id}::${sauce}`;
}

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

  const requested = rawItems.map((line) => ({
    id: typeof line?.id === "string" ? line.id : "",
    quantity: typeof line?.quantity === "number" ? line.quantity : 0,
    sauce: typeof line?.sauce === "string" ? line.sauce.trim().slice(0, 100) : "",
  }));

  if (requested.some((line) => !line.id)) {
    return NextResponse.json({ error: "Некорректный состав корзины" }, { status: 400 });
  }
  if (
    requested.some(
      (line) =>
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > MAX_ITEM_QUANTITY,
    )
  ) {
    return NextResponse.json({ error: "Некорректное количество блюда" }, { status: 400 });
  }

  const menuById = new Map(
    (await getMenuItemsByIds([...new Set(requested.map((line) => line.id))])).map((item) => [
      item.id,
      item,
    ]),
  );

  const unavailable: string[] = [];
  const cartLines: CartLineInput[] = [];
  const keys: { key: string; sauce: string }[] = [];

  for (const line of requested) {
    const menuItem = menuById.get(line.id);
    if (!menuItem || menuItem.isAvailable === false || menuItem.price == null) {
      unavailable.push(line.id);
      continue;
    }

    cartLines.push({
      id: menuItem.id,
      categoryId: menuItem.categoryId,
      price: menuItem.price,
      quantity: line.quantity,
    });
    keys.push({ key: cartKey(line.id, line.sauce), sauce: line.sauce });
  }

  const settings = await getSiteSettings();
  const promoCode = typeof body.promoCode === "string" ? body.promoCode : undefined;

  const { lines, totals } = await getCartPricing(cartLines, {
    deliveryType: "delivery",
    deliveryCost: settings.deliveryCost,
    promoCode,
  });

  return NextResponse.json({
    lines: lines.map((line, index) => ({
      key: keys[index].key,
      id: line.id,
      sauce: keys[index].sauce,
      quantity: line.quantity,
      basePrice: line.basePrice,
      price: line.price,
      // Итог по строке считается здесь, чтобы клиент ничего не умножал.
      lineTotal: roundMoney(line.price * line.quantity),
      baseLineTotal: roundMoney(line.basePrice * line.quantity),
      discount: line.discount,
      promotionId: line.promotionId,
      badge: line.badge,
      label: line.label,
    })),
    totals,
    unavailable,
    deliveryThreshold: settings.deliveryThreshold,
    deliveryCost: settings.deliveryCost,
  });
}