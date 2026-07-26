import fs from "fs";
import path from "path";
import type { Order, OrderStatus } from "@/types/order";

// Файловое хранилище для локальной разработки — в Next.js модуль с
// in-memory Map получает отдельный инстанс в route handler'ах и в RSC,
// поэтому состояние не шарится. На проде (особенно serverless) нужна
// настоящая БД (Postgres/Prisma и т.п.) — это временное решение.
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

function readAll(): Record<string, Order> {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeAll(orders: Record<string, Order>) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    throw new Error(
      "Не удалось сохранить заказ: файловое хранилище недоступно на этом хостинге (нужна БД для serverless-окружений).",
      { cause: error },
    );
  }
}

export function saveOrder(order: Order) {
  const orders = readAll();
  orders[order.id] = order;
  writeAll(orders);
}

export function getOrder(id: string): Order | undefined {
  return readAll()[id];
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  const orders = readAll();
  const order = orders[id];
  if (!order) return;
  orders[id] = { ...order, status };
  writeAll(orders);
}

export function findOrderByPaymentId(paymentId: string): Order | undefined {
  return Object.values(readAll()).find((order) => order.paymentId === paymentId);
}

export function getAllOrders(): Order[] {
  return Object.values(readAll()).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}
