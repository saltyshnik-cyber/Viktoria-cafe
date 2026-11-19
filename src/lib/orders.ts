import type { Order, OrderStatus } from "@/types/order";
import { sql, ensureSchema } from "@/lib/db";

type OrderRow = {
  id: string;
  name: string;
  phone: string;
  address: string;
  lat: number | null;
  lon: number | null;
  comment: string | null;
  items: Order["items"];
  total_price: number;
  delivery_fee: number;
  payment_method: Order["paymentMethod"];
  delivery_type: string;
  status: OrderStatus;
  payment_id: string | null;
  items_discount: number | string | null;
  applied_promotion_ids: Array<string | number> | null;
  created_at: string | Date;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    lat: row.lat ?? undefined,
    lon: row.lon ?? undefined,
    comment: row.comment ?? undefined,
    items: row.items,
    totalPrice: row.total_price,
    deliveryFee: row.delivery_fee ?? 0,
    paymentMethod: row.payment_method,
    deliveryType: row.delivery_type === "pickup" ? "pickup" : "delivery",
    status: row.status,
    paymentId: row.payment_id ?? undefined,
    // numeric и bigint[] приходят строками — приводим на границе.
    itemsDiscount: row.items_discount == null ? 0 : Number(row.items_discount),
    appliedPromotionIds: (row.applied_promotion_ids ?? []).map(Number),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

export async function saveOrder(order: Order): Promise<void> {
  await ensureSchema();
  // Массив id собираем из jsonb-строки: прямое приведение ${json}::bigint[]
  // зависит от того, как драйвер размечает параметр, а этот путь работает всегда.
  const promotionIdsJson = JSON.stringify(order.appliedPromotionIds ?? []);

  await sql`
    INSERT INTO orders (id, name, phone, address, lat, lon, comment, items, total_price, delivery_fee, payment_method, delivery_type, status, payment_id, items_discount, applied_promotion_ids, created_at)
    VALUES (
      ${order.id}, ${order.name}, ${order.phone}, ${order.address}, ${order.lat ?? null}, ${order.lon ?? null},
      ${order.comment ?? null}, ${JSON.stringify(order.items)}::jsonb, ${order.totalPrice}, ${order.deliveryFee},
      ${order.paymentMethod}, ${order.deliveryType}, ${order.status}, ${order.paymentId ?? null},
      ${order.itemsDiscount ?? 0},
      ARRAY(SELECT jsonb_array_elements_text(${promotionIdsJson}::jsonb))::bigint[],
      ${order.createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      comment = EXCLUDED.comment,
      items = EXCLUDED.items,
      total_price = EXCLUDED.total_price,
      delivery_fee = EXCLUDED.delivery_fee,
      payment_method = EXCLUDED.payment_method,
      delivery_type = EXCLUDED.delivery_type,
      status = EXCLUDED.status,
      payment_id = EXCLUDED.payment_id,
      items_discount = EXCLUDED.items_discount,
      applied_promotion_ids = EXCLUDED.applied_promotion_ids
  `;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE id = ${id}`) as OrderRow[];
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await ensureSchema();
  await sql`UPDATE orders SET status = ${status} WHERE id = ${id}`;
}

export async function findOrderByPaymentId(paymentId: string): Promise<Order | undefined> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders WHERE payment_id = ${paymentId}`) as OrderRow[];
  return rows[0] ? rowToOrder(rows[0]) : undefined;
}

export async function getAllOrders(): Promise<Order[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM orders ORDER BY created_at DESC`) as OrderRow[];
  return rows.map(rowToOrder);
}