import { NextResponse } from "next/server";
import { getPayment } from "@/lib/yookassa";
import { findOrderByPaymentId, updateOrderStatus } from "@/lib/orders";
import { notifyPaidOrder } from "@/lib/telegram";

export async function POST(request: Request) {
  const body = await request.json();
  const paymentId = body?.object?.id as string | undefined;

  if (!paymentId) {
    return NextResponse.json({ error: "Некорректное уведомление" }, { status: 400 });
  }

  // Телу вебхука не доверяем напрямую — перепроверяем статус платежа через API ЮKassa
  const payment = await getPayment(paymentId);
  const order = findOrderByPaymentId(paymentId);

  if (order && payment.status === "succeeded" && order.status !== "paid") {
    updateOrderStatus(order.id, "paid");
    await notifyPaidOrder({ ...order, status: "paid" });
  }

  return NextResponse.json({ ok: true });
}
