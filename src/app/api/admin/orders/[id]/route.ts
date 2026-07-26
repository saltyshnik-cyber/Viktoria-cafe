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

  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  updateOrderStatus(id, status);
  return NextResponse.json({ ok: true });
}
