import { getAllOrders } from "@/lib/orders";
import { PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import AdminNav from "@/components/admin/AdminNav";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const orders = getAllOrders();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminNav />
      <h1 className="mt-6 text-2xl font-bold text-ink">Заказы</h1>

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
                <div>{order.address}</div>
                {order.comment && (
                  <div className="sm:col-span-2">
                    Комментарий: {order.comment}
                  </div>
                )}
              </div>

              <ul className="mt-3 space-y-1 text-sm text-ink/70">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity} — {item.price * item.quantity} ₽
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
