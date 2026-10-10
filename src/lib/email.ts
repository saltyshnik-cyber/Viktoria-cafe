import type { Order } from "@/types/order";
import { DELIVERY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/orderLabels";
import { yandexMapPinUrl } from "@/lib/mapsLink";

const RESEND_API_URL = "https://api.resend.com/emails";

// Тестовый отправитель Resend — работает без подтверждения домена, но
// доставляет письма только на email владельца аккаунта Resend. Для
// отправки на любой адрес подтвердите свой домен и задайте RESEND_FROM.
const DEFAULT_FROM = "Кафе Виктория <onboarding@resend.dev>";

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return null;
  return { apiKey, to, from: process.env.RESEND_FROM || DEFAULT_FROM };
}

export function isEmailConfigured() {
  return getConfig() !== null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatOrderEmail(order: Order, title: string): { subject: string; html: string; text: string } {
  const createdAt = new Date(order.createdAt).toLocaleString("ru-RU", {
    timeZone: "Asia/Krasnoyarsk",
  });
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod];
  const deliveryLabel = DELIVERY_TYPE_LABELS[order.deliveryType];
  const isPickup = order.deliveryType === "pickup";
  const mapUrl =
    order.lat != null && order.lon != null ? yandexMapPinUrl(order.lat, order.lon) : undefined;

  const itemLine = (item: Order["items"][number]) =>
    `${item.name}${item.sauce ? ` (соус: ${item.sauce})` : ""} × ${item.quantity} — ${item.price * item.quantity} ₽`;

  const text = [
    `${title} №${order.id}`,
    `Время: ${createdAt}`,
    "",
    ...order.items.map((item) => `• ${itemLine(item)}`),
    "",
    `Итого: ${order.totalPrice} ₽`,
    `Оплата: ${paymentLabel}`,
    "",
    `Имя: ${order.name}`,
    `Телефон: ${order.phone}`,
    `Получение: ${deliveryLabel}`,
    isPickup ? undefined : `Адрес: ${order.address}`,
    mapUrl ? `Точка на карте: ${mapUrl}` : undefined,
    order.comment ? `Комментарий: ${order.comment}` : undefined,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");

  const html = `
<div style="font-family:Arial,sans-serif;font-size:15px;color:#222;max-width:520px">
  <h2 style="margin:0 0 4px">${escapeHtml(title)} №${escapeHtml(order.id)}</h2>
  <div style="color:#777;margin-bottom:16px">${escapeHtml(createdAt)}</div>
  <ul style="padding-left:18px;margin:0 0 12px">
    ${order.items.map((item) => `<li>${escapeHtml(itemLine(item))}</li>`).join("\n    ")}
  </ul>
  <div style="font-size:17px;font-weight:bold">Итого: ${order.totalPrice} ₽</div>
  <div style="margin-bottom:16px">Оплата: ${escapeHtml(paymentLabel)}</div>
  <div><b>Имя:</b> ${escapeHtml(order.name)}</div>
  <div><b>Телефон:</b> <a href="tel:${escapeHtml(order.phone)}">${escapeHtml(order.phone)}</a></div>
  <div><b>Получение:</b> ${escapeHtml(deliveryLabel)}</div>
  ${
    isPickup
      ? ""
      : `<div><b>Адрес:</b> ${escapeHtml(order.address)}${
          mapUrl ? ` — <a href="${escapeHtml(mapUrl)}">точка на карте</a>` : ""
        }</div>`
  }
  ${order.comment ? `<div><b>Комментарий:</b> ${escapeHtml(order.comment)}</div>` : ""}
</div>`.trim();

  return { subject: `${title} №${order.id} — ${order.totalPrice} ₽`, html, text };
}

async function sendEmail(subject: string, html: string, text: string) {
  const config = getConfig();
  if (!config) {
    console.warn(
      "Email-уведомления не настроены: заполните RESEND_API_KEY и OWNER_NOTIFICATION_EMAIL в .env",
    );
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: config.from, to: [config.to], subject, html, text }),
  });

  if (!response.ok) {
    console.error(`Ошибка Resend (${response.status}):`, await response.text());
  }
}

export async function notifyNewOrder(order: Order) {
  try {
    const { subject, html, text } = formatOrderEmail(order, "Новый заказ");
    await sendEmail(subject, html, text);
  } catch (error) {
    console.error("Не удалось отправить email-уведомление о заказе:", error);
  }
}

export async function notifyPaidOrder(order: Order) {
  try {
    const { subject, html, text } = formatOrderEmail(order, "Заказ оплачен");
    await sendEmail(subject, html, text);
  } catch (error) {
    console.error("Не удалось отправить email-уведомление об оплате:", error);
  }
}
