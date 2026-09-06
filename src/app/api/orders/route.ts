import { NextResponse } from "next/server";
import type { Order, OrderPayload } from "@/types/order";
import { saveOrder } from "@/lib/orders";
import { createPayment, isYooKassaConfigured } from "@/lib/yookassa";
import { notifyNewOrder } from "@/lib/telegram";
import { isBlank, isValidPhone } from "@/lib/validation";
import { checkDeliveryZone } from "@/lib/deliveryZone";

export async function POST(request: Request) {
  const payload = (await request.json()) as OrderPayload;

  if (isBlank(payload.name)) {
    return NextResponse.json({ error: "Введите имя" }, { status: 400 });
  }

  if (isBlank(payload.phone) || !isValidPhone(payload.phone)) {
    return NextResponse.json(
      { error: "Введите телефон в формате +7XXXXXXXXXX" },
      { status: 400 },
    );
  }

  if (isBlank(payload.address)) {
    return NextResponse.json(
      { error: "Введите адрес доставки" },
      { status: 400 },
    );
  }

  if (!payload.items?.length) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }

  const hasValidCoords =
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

  const id = crypto.randomUUID().slice(0, 8);

  const order: Order = {
    ...payload,
    lat: hasValidCoords ? payload.lat : undefined,
    lon: hasValidCoords ? payload.lon : undefined,
    id,
    createdAt: new Date().toISOString(),
    status: payload.paymentMethod === "card" ? "awaiting_payment" : "new",
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
      amount: payload.totalPrice,
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
