"use client";

import { useEffect, useRef, useState } from "react";
import type { Order, OrderStatus } from "@/types/order";
import { DELIVERY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import { yandexMapPinUrl } from "@/lib/mapsLink";
import { playNotificationSound, unlockNotificationSound } from "@/lib/orderNotificationSound";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PrintReceiptButton from "@/components/admin/PrintReceiptButton";
import OrderReceipt from "@/components/admin/OrderReceipt";

const SOUND_PREF_KEY = "admin-orders-sound-enabled";
const VISIBLE_POLL_MS = 12_000;
const HIDDEN_POLL_MS = 45_000;

type Banner = { orderId: string; message: string };

export default function AdminOrdersView({
  initialOrders,
  cafeName,
  cafeAddress,
  cafePhone,
}: {
  initialOrders: Order[];
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SOUND_PREF_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Заказы, уже известные на момент открытия страницы, — чтобы не
  // уведомлять о них при первом опросе.
  const knownIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const soundEnabledRef = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    document.title = banners.length > 0 ? `(${banners.length}) Заказы` : "Заказы";
    return () => {
      document.title = "Заказы";
    };
  }, [banners.length]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const response = await fetch("/api/admin/orders");
        if (response.ok && !cancelled) {
          const data = (await response.json()) as { orders: Order[] };
          const fresh = data.orders.filter((o) => !knownIdsRef.current.has(o.id));

          if (fresh.length > 0) {
            fresh.forEach((o) => knownIdsRef.current.add(o.id));
            setBanners((prev) => [
              ...prev,
              ...fresh.map((o) => ({
                orderId: o.id,
                message: `Новый заказ №${o.id} на сумму ${o.totalPrice} ₽`,
              })),
            ]);

            if (soundEnabledRef.current) playNotificationSound();

            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              fresh.forEach((o) => {
                new Notification(`Новый заказ №${o.id}`, {
                  body: `${o.name} · ${o.totalPrice} ₽`,
                });
              });
            }
          }

          setOrders(data.orders);
        }
      } catch {
        // сеть недоступна — просто попробуем на следующем цикле
      } finally {
        if (!cancelled) {
          const delay = document.visibilityState === "hidden" ? HIDDEN_POLL_MS : VISIBLE_POLL_MS;
          timeoutId = setTimeout(poll, delay);
        }
      }
    }

    timeoutId = setTimeout(poll, VISIBLE_POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  function handleToggleSound() {
    const next = !soundEnabled;
    if (next) {
      // Разблокировать звук и спросить разрешение на уведомления можно
      // только прямо в обработчике пользовательского клика.
      unlockNotificationSound();
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }
    setSoundEnabled(next);
    try {
      localStorage.setItem(SOUND_PREF_KEY, String(next));
    } catch {
      // localStorage недоступен — переключатель просто не запомнится
    }
  }

  function handleStatusChange(orderId: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    setBanners((prev) => prev.filter((b) => b.orderId !== orderId));
  }

  function dismissBanner(orderId: string) {
    setBanners((prev) => prev.filter((b) => b.orderId !== orderId));
  }

  const highlightedIds = new Set(banners.map((b) => b.orderId));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {banners.length > 0 && (
        <div className="mb-4 space-y-2">
          {banners.map((banner) => (
            <div
              key={banner.orderId}
              className="flex items-center justify-between gap-3 rounded-xl2 border border-primary bg-primary/10 px-4 py-3 text-sm font-medium text-ink"
            >
              <span>🆕 {banner.message}</span>
              <button
                type="button"
                onClick={() => dismissBanner(banner.orderId)}
                className="shrink-0 rounded-full px-2 py-1 text-ink/50 hover:text-primary"
                aria-label="Закрыть уведомление"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Заказы</h1>

        <div className="flex flex-col items-end">
          <button
            type="button"
            onClick={handleToggleSound}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              soundEnabled
                ? "border-primary bg-primary text-cream"
                : "border-black/10 bg-white text-ink/60 hover:border-primary hover:text-primary"
            }`}
          >
            🔔 Звук уведомлений: {soundEnabled ? "вкл" : "выкл"}
          </button>
          {!soundEnabled && (
            <span className="mt-1 text-xs text-ink/50">Нажмите, чтобы включить звук</span>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 text-ink/60">Заказов пока нет.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-xl2 border bg-white p-4 transition ${
                highlightedIds.has(order.id)
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-black/10"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    Заказ №{order.id}
                    <span
                      className={`rounded-full border px-3 py-0.5 text-sm font-bold ${
                        order.deliveryType === "pickup"
                          ? "border-amber-400 bg-amber-100 text-amber-900"
                          : "border-sky-400 bg-sky-100 text-sky-900"
                      }`}
                    >
                      {order.deliveryType === "pickup" ? "🏃" : "🚚"}{" "}
                      {DELIVERY_TYPE_LABELS[order.deliveryType]}
                    </span>
                  </div>
                  <div className="text-sm text-ink/50">
                    {new Date(order.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PrintReceiptButton orderId={order.id} />
                  <OrderStatusSelect
                    orderId={order.id}
                    status={order.status}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-1 text-sm text-ink/70 sm:grid-cols-2">
                <div>
                  {order.name} · {order.phone}
                </div>
                {order.deliveryType === "delivery" && (
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
                )}
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

              {order.deliveryFee > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm text-ink/70">
                  <span>Доставка</span>
                  <span>{order.deliveryFee} ₽</span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 text-sm">
                <span className="text-ink/50">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </span>
                <span className="font-semibold text-ink">
                  {order.totalPrice} ₽
                </span>
              </div>

              <OrderReceipt
                order={order}
                cafeName={cafeName}
                cafeAddress={cafeAddress}
                cafePhone={cafePhone}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
