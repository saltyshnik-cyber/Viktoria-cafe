import { DELIVERY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import type { Order } from "@/types/order";

function ReceiptDivider() {
  return <div className="receipt-divider" />;
}

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
      <div className="receipt-title text-center">{cafeName}</div>
      {cafeAddress && <div className="text-center">{cafeAddress}</div>}
      {cafePhone && <div className="text-center">{cafePhone}</div>}

      <ReceiptDivider />
      <div>Заказ №{order.id}</div>
      <div>{new Date(order.createdAt).toLocaleString("ru-RU")}</div>

      <ReceiptDivider />
      <div>Клиент: {order.name}</div>
      <div>Тел: {order.phone}</div>
      <div className="receipt-item-name">
        {DELIVERY_TYPE_LABELS[order.deliveryType].toUpperCase()}
      </div>
      {order.deliveryType === "delivery" && order.address && (
        <div>Адрес: {order.address}</div>
      )}
      {order.comment && <div>Комментарий: {order.comment}</div>}

      <ReceiptDivider />
      {order.items.map((item, index) => (
        <div key={`${item.id}-${item.sauce ?? ""}-${index}`} className="receipt-item">
          <div className="receipt-item-name">{item.name}</div>
          {item.sauce && <div>&nbsp;&nbsp;Соус: {item.sauce}</div>}
          <div className="flex justify-between">
            <span>
              &nbsp;&nbsp;{item.quantity} x {item.price} ₽
            </span>
            <span>{item.quantity * item.price} ₽</span>
          </div>
        </div>
      ))}

      <ReceiptDivider />
      {order.deliveryFee > 0 && (
        <div className="flex justify-between">
          <span>Доставка</span>
          <span>{order.deliveryFee} ₽</span>
        </div>
      )}
      <div className="receipt-total flex justify-between">
        <span>Итого</span>
        <span>{order.totalPrice} ₽</span>
      </div>
      <div>Оплата: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</div>

      <ReceiptDivider />
      <div className="text-center">Спасибо за заказ!</div>
    </div>
  );
}
