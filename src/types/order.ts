export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sauce?: string;
};

export type PaymentMethod = "card" | "cash";

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
  totalPrice: number;
  paymentMethod: PaymentMethod;
};

export type Order = OrderPayload & {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentId?: string;
};
