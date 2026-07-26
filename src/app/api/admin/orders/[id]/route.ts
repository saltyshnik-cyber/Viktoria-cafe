import { NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES } from "@/lib/orderLabels";
import type { OrderStatus } from "@/types/order";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const status = body?.status as OrderStatus;

  if (!ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  try {
    await updateOrderStatus(id, status);
  } catch (error) {
    console.error("Не удалось изменить статус заказа:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить изменение статуса" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
