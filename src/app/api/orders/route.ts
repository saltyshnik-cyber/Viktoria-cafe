import { NextResponse } from "next/server";
import type { Order, OrderPayload } from "@/types/order";
import { saveOrder } from "@/lib/orders";
import { createPayment, isYooKassaConfigured } from "@/lib/yookassa";
import { notifyNewOrder } from "@/lib/telegram";

export async function POST(request: Request) {
  const payload = (await request.json()) as OrderPayload;

  if (
    !payload.name?.trim() ||
    !payload.phone?.trim() ||
    !payload.address?.trim()
  ) {
    return NextResponse.json(
      { error: "Заполните имя, телефон и адрес доставки" },
      { status: 400 },
    );
  }

  if (!payload.items?.length) {
    return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
  }

  const id = crypto.randomUUID().slice(0, 8);
  const order: Order = {
    ...payload,
    id,
    createdAt: new Date().toISOString(),
    status: payload.paymentMethod === "card" ? "awaiting_payment" : "new",
  };

  // TODO: сохранить заказ в постоянной БД вместо файла .data/orders.json
  saveOrder(order);

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

    saveOrder({ ...order, paymentId: payment.id });

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
