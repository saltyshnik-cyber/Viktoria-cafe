import type { Order, OrderItem, OrderStatus } from "@/types/order";
import { sql, ensureSchema } from "@/lib/db";

// В orders.items (jsonb) деньги хранятся в snake_case: base_price, final_price,
// discount_amount, promotion_id. В коде тип OrderItem остаётся camelCase —
// перевод между двумя формами делают itemToJson и jsonToItem, чтобы ни
// корзина, ни чек, ни админка не зависели от формы хранения.

type StoredItem = {
  id: string;
  name: string;
  quantity: number;
  sauce?: string | null;
  base_price?: number | string | null;
  final_price?: number | string | null;
  discount_amount?: number | string | null;
  promotion_id?: number | string | null;
  /** Старые заказы: до появления акций цена лежала в price. */
  price?: number | string | null;
};

type OrderRow = {
  id: string;
  name: string;
  phone: string;
  address: string;
  lat: number | null;
  lon: number | null;
  comment: string | null;
  items: unknown;
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

function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

function itemToJson(item: OrderItem): StoredItem {
  const basePrice = item.basePrice ?? item.price;
  const stored: StoredItem = {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    base_price: basePrice,
    final_price: item.price,
    discount_amount: item.discount ?? 0,
    promotion_id: item.promotionId ?? null,
  };
  if (item.sauce) stored.sauce = item.sauce;
  return stored;
}

function jsonToItem(raw: unknown): OrderItem {
  const stored = (raw ?? {}) as StoredItem;
  const finalPrice = stored.final_price ?? stored.price ?? 0;
  const basePrice = stored.base_price ?? finalPrice;
  const promotionId =
    stored.promotion_id === null || stored.promotion_id === undefined
      ? null
      : num(stored.promotion_id);

  return {
    id: String(stored.id),
    name: String(stored.name ?? ""),
    price: num(finalPrice),
    basePrice: num(basePrice),
    discount: num(stored.discount_amount),
    promotionId,
    quantity: Number(stored.quantity ?? 1),
    sauce: stored.sauce ?? undefined,
  };
}

function rowToOrder(row: OrderRow): Order {
  const rawItems = Array.isArray(row.items) ? row.items : [];

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    lat: row.lat ?? undefined,
    lon: row.lon ?? undefined,
    comment: row.comment ?? undefined,
    items: rawItems.map(jsonToItem),
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
  const itemsJson = JSON.stringify(order.items.map(itemToJson));

  await sql`
    INSERT INTO orders (id, name, phone, address, lat, lon, comment, items, total_price, delivery_fee, payment_method, delivery_type, status, payment_id, items_discount, applied_promotion_ids, created_at)
    VALUES (
      ${order.id}, ${order.name}, ${order.phone}, ${order.address}, ${order.lat ?? null}, ${order.lon ?? null},
      ${order.comment ?? null}, ${itemsJson}::jsonb, ${order.totalPrice}, ${order.deliveryFee},
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