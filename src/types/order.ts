export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sauce?: string;
};

export type PaymentMethod = "card" | "cash";

export type DeliveryType = "delivery" | "pickup";

export type OrderStatus =
  | "new"
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export type OrderPayload = {
  name: string;
  phone: string;
  address: string;
  lat?: number;
  lon?: number;
  comment?: string;
  items: OrderItem[];
  // Итог к оплате: блюда + стоимость доставки. Считается сервером.
  totalPrice: number;
  // Стоимость доставки на момент заказа (0 — самовывоз или бесплатная доставка).
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
};

export type Order = OrderPayload & {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentId?: string;
};
