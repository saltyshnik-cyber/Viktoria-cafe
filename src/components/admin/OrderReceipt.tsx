import { PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import type { Order } from "@/types/order";

const DIVIDER = "-".repeat(32);

export default function OrderReceipt({
  order,
  cafeName,
  cafeAddress,
  cafePhone,
}: {
  order: Order;
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
}) {
  return (
    <div id={`receipt-${order.id}`} className="receipt">
      <div className="text-center font-bold">{cafeName}</div>
      {cafeAddress && <div className="text-center">{cafeAddress}</div>}
      {cafePhone && <div className="text-center">{cafePhone}</div>}

      <div>{DIVIDER}</div>
      <div>Заказ №{order.id}</div>
      <div>{new Date(order.createdAt).toLocaleString("ru-RU")}</div>

      <div>{DIVIDER}</div>
      <div>Клиент: {order.name}</div>
      <div>Тел: {order.phone}</div>
      {order.address && <div>Адрес: {order.address}</div>}
      {order.comment && <div>Комментарий: {order.comment}</div>}

      <div>{DIVIDER}</div>
      {order.items.map((item, index) => (
        <div key={`${item.id}-${item.sauce ?? ""}-${index}`} className="mb-1">
          <div>{item.name}</div>
          {item.sauce && <div>&nbsp;&nbsp;Соус: {item.sauce}</div>}
          <div className="flex justify-between">
            <span>
              &nbsp;&nbsp;{item.quantity} x {item.price} ₽
            </span>
            <span>{item.quantity * item.price} ₽</span>
          </div>
        </div>
      ))}

      <div>{DIVIDER}</div>
      <div className="flex justify-between font-bold">
        <span>Итого</span>
        <span>{order.totalPrice} ₽</span>
      </div>
      <div>Оплата: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</div>

      <div>{DIVIDER}</div>
      <div className="text-center">Спасибо за заказ!</div>
    </div>
  );
}
