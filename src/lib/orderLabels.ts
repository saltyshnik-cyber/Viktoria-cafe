import type { DeliveryType, OrderStatus, PaymentMethod } from "@/types/order";

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "awaiting_payment",
  "paid",
  "preparing",
  "delivering",
  "completed",
  "cancelled",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен",
  preparing: "Готовится",
  delivering: "В пути",
  completed: "Выполнен",
  cancelled: "Отменён",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  delivery: "Доставка",
  pickup: "Самовывоз",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Онлайн картой",
  cash: "Курьеру при получении",
};
