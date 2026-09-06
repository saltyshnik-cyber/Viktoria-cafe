import { getAllOrders } from "@/lib/orders";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import { yandexMapPinUrl } from "@/lib/mapsLink";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Заказы</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-ink/60">Заказов пока нет.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl2 border border-black/10 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink">
                    Заказ №{order.id}
                  </div>
                  <div className="text-sm text-ink/50">
                    {new Date(order.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <OrderStatusSelect orderId={order.id} status={order.status} />
              </div>

              <div className="mt-3 grid gap-1 text-sm text-ink/70 sm:grid-cols-2">
                <div>
                  {order.name} · {order.phone}
                </div>
                <div>
                  {order.address}
                  {order.lat != null && order.lon != null && (
                    <a
                      href={yandexMapPinUrl(order.lat, order.lon)}
                      target="_blank"
                      rel="noopener"
                      className="ml-2 text-primary hover:underline"
                    >
                      Точка на карте →
                    </a>
                  )}
                </div>
                {order.comment && (
                  <div className="sm:col-span-2">
                    Комментарий: {order.comment}
                  </div>
                )}
              </div>

              <ul className="mt-3 space-y-1 text-sm text-ink/70">
                {order.items.map((item, index) => (
                  <li key={`${item.id}-${item.sauce ?? ""}-${index}`}>
                    {item.name}
                    {item.sauce && (
                      <span className="font-medium text-ink"> — соус: {item.sauce}</span>
                    )}{" "}
                    × {item.quantity} — {item.price * item.quantity} ₽
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
                <span className="text-ink/50">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </span>
                <span className="font-semibold text-ink">
                  {order.totalPrice} ₽
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
