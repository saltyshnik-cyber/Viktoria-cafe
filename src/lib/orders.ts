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
  payment_method: Order["paymentMethod"];
  status: OrderStatus;
  payment_id: string | null;
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
    paymentMethod: row.payment_method,
    status: row.status,
    paymentId: row.payment_id ?? undefined,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

export async function saveOrder(order: Order): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO orders (id, name, phone, address, lat, lon, comment, items, total_price, payment_method, status, payment_id, created_at)
    VALUES (
      ${order.id}, ${order.name}, ${order.phone}, ${order.address}, ${order.lat ?? null}, ${order.lon ?? null},
      ${order.comment ?? null}, ${JSON.stringify(order.items)}::jsonb, ${order.totalPrice}, ${order.paymentMethod},
      ${order.status}, ${order.paymentId ?? null}, ${order.createdAt}
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
      payment_method = EXCLUDED.payment_method,
      status = EXCLUDED.status,
      payment_id = EXCLUDED.payment_id
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
