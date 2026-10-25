import { NextResponse } from "next/server";
import type { Order, OrderItem, OrderPayload } from "@/types/order";
import { saveOrder } from "@/lib/orders";
import { createPayment, isYooKassaConfigured } from "@/lib/yookassa";
import { notifyNewOrder } from "@/lib/email";
import { isBlank, isValidPhone } from "@/lib/validation";
import { checkDeliveryZone } from "@/lib/deliveryZone";
import { getOrderAvailability } from "@/lib/businessHours";
import { getSiteSettings } from "@/lib/siteSettings";
import { getMenuItemsByIds } from "@/lib/menu-store";
import {
  calculateOrderTotals,
  deliveryMinimumMessage,
  getDeliveryShortfall,
  sumItems,
} from "@/lib/orderPricing";

const MAX_ITEM_QUANTITY = 99;

// Тело запроса — недоверенные данные клиента. Цены и итоговая сумма из него
// не используются вовсе: сервер сам берёт цены из меню и считает итог.
type OrderRequestBody = Pick<
  OrderPayload,
  "name" | "phone" | "address" | "lat" | "lon" | "comment" | "paymentMethod"
> & {
  items?: { id?: unknown; name?: unknown; quantity?: unknown; sauce?: unknown }[];
  deliveryType?: unknown;
  consent?: boolean;
};

export async function POST(request: Request) {
  const { consent, ...payload } = (await request.json()) as OrderRequestBody;

  const settings = await getSiteSettings();

  const availability = getOrderAvailability(settings.workingHours);
  if (!availability.open) {
    return NextResponse.json({ error: availability.message }, { status: 403 });
  }

  if (consent !== true) {
    return NextResponse.json(
      { error: "Нужно согласие на обработку персональных данных" },
      { status: 400 },
    );
  }

  if (isBlank(payload.name)) {
    return NextResponse.json({ error: "Введите имя" }, { status: 400 });
  }

  if (isBlank(payload.phone) || !isValidPhone(payload.phone)) {
    return NextResponse.json(
      { error: "Введите телефон в формате +7XXXXXXXXXX" },
      { status: 400 },
    );
  }

  // Вкладка, открытая до выхода самовывоза, deliveryType не присылает — это доставка.
  const deliveryType = payload.deliveryType ?? "delivery";
  if (deliveryType !== "delivery" && deliveryType !== "pickup") {
    return NextResponse.json({ error: "Неверный способ получения заказа" }, { status: 400 });
  }
  const isPickup = deliveryType === "pickup";

  if (!isPickup && isBlank(payload.address)) {
    return NextResponse.json(
      { error: "Введите адрес доставки" },
      { status: 400 },
    );
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }

  const hasValidCoords =
    !isPickup &&
    typeof payload.lat === "number" &&
    typeof payload.lon === "number" &&
    Number.isFinite(payload.lat) &&
    Number.isFinite(payload.lon);

  // Проверяем зону доставки только когда есть координаты (клиент подтвердил
  // точку на карте) — если геокодирование было недоступно и пришёл только
  // текстовый адрес, не блокируем заказ: оператор уточнит адрес по телефону.
  if (hasValidCoords) {
    const zoneCheck = checkDeliveryZone(
      { lat: payload.lat as number, lon: payload.lon as number },
      payload.address,
    );
    if (!zoneCheck.ok) {
      return NextResponse.json({ error: zoneCheck.reason }, { status: 400 });
    }
  }

  const requestedIds = payload.items.map((line) => line?.id);
  if (!requestedIds.every((id): id is string => typeof id === "string" && id.length > 0)) {
    return NextResponse.json({ error: "Некорректный состав заказа" }, { status: 400 });
  }
  const menuById = new Map(
    (await getMenuItemsByIds([...new Set(requestedIds)])).map((menuItem) => [menuItem.id, menuItem]),
  );

  const orderItems: OrderItem[] = [];
  for (const line of payload.items) {
    const quantity = line.quantity;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      return NextResponse.json({ error: "Некорректное количество блюда в корзине" }, { status: 400 });
    }

    const menuItem = menuById.get(line.id as string);
    if (!menuItem || menuItem.isAvailable === false || menuItem.price == null) {
      const label =
        menuItem?.name ?? (typeof line.name === "string" ? line.name.slice(0, 80) : "из корзины");
      return NextResponse.json(
        { error: `Блюдо «${label}» сейчас недоступно — уберите его из корзины.` },
        { status: 400 },
      );
    }

    const sauce = typeof line.sauce === "string" ? line.sauce.trim().slice(0, 100) : "";
    orderItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      sauce: sauce || undefined,
    });
  }

  const itemsTotal = sumItems(orderItems);

  const shortfall = getDeliveryShortfall(itemsTotal, deliveryType, settings.deliveryThreshold);
  if (shortfall > 0) {
    return NextResponse.json(
      { error: deliveryMinimumMessage(settings.deliveryThreshold, shortfall) },
      { status: 400 },
    );
  }

  const totals = calculateOrderTotals(itemsTotal, deliveryType, settings.deliveryCost);

  const id = crypto.randomUUID().slice(0, 8);

  const order: Order = {
    id,
    createdAt: new Date().toISOString(),
    status: payload.paymentMethod === "card" ? "awaiting_payment" : "new",
    name: payload.name,
    phone: payload.phone,
    address: isPickup ? "" : payload.address,
    lat: hasValidCoords ? payload.lat : undefined,
    lon: hasValidCoords ? payload.lon : undefined,
    comment: payload.comment,
    items: orderItems,
    totalPrice: totals.total,
    deliveryFee: totals.deliveryFee,
    paymentMethod: payload.paymentMethod,
    deliveryType,
  };

  try {
    await saveOrder(order);
  } catch (error) {
    console.error("Не удалось сохранить заказ:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить заказ. Попробуйте ещё раз или позвоните нам." },
      { status: 500 },
    );
  }

  if (payload.paymentMethod === "cash") {
    // Заказ с оплатой курьеру подтверждён сразу — уведомляем кухню
    await notifyNewOrder(order);
    return NextResponse.json({ orderId: id, paymentUrl: null });
  }

  if (!isYooKassaConfigured()) {
    return NextResponse.json(
      {
        error:
          "Онлайн-оплата временно недоступна. Выберите оплату курьеру или попробуйте позже.",
      },
      { status: 503 },
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const payment = await createPayment({
      orderId: id,
      amount: order.totalPrice,
      description: `Заказ №${id} в кафе «Виктория»`,
      returnUrl: `${origin}/order/${id}`,
    });

    try {
      await saveOrder({ ...order, paymentId: payment.id });
    } catch (error) {
      // Платёж в ЮKassa уже создан — не блокируем оплату клиенту, но
      // без этой записи вебхук не сможет сопоставить оплату с заказом.
      console.error("Не удалось привязать paymentId к заказу:", error);
    }

    return NextResponse.json({
      orderId: id,
      paymentUrl: payment.confirmation?.confirmation_url ?? null,
    });
  } catch (error) {
    console.error("Не удалось создать платёж в ЮKassa:", error);
    return NextResponse.json(
      { error: "Не удалось создать платёж. Попробуйте ещё раз." },
      { status: 502 },
    );
  }
}
