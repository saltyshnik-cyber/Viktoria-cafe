import type { Order } from "@/types/order";
import { yandexMapPinUrl } from "@/lib/mapsLink";

const TELEGRAM_API_URL = "https://api.telegram.org";

function getCredentials() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

export function isTelegramConfigured() {
  return getCredentials() !== null;
}

async function sendTelegramMessage(text: string) {
  const credentials = getCredentials();
  if (!credentials) {
    console.warn(
      "Telegram не настроен: заполните TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env",
    );
    return;
  }

  const response = await fetch(
    `${TELEGRAM_API_URL}/bot${credentials.token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: credentials.chatId,
        text,
        parse_mode: "HTML",
      }),
    },
  );

  if (!response.ok) {
    console.error(`Ошибка Telegram (${response.status}):`, await response.text());
  }
}

function formatOrderMessage(order: Order, title: string): string {
  const itemsList = order.items
    .map((item) => `• ${item.name} × ${item.quantity} — ${item.price * item.quantity} ₽`)
    .join("\n");

  const paymentLabel =
    order.paymentMethod === "card" ? "Онлайн картой" : "Курьеру при получении";

  return [
    `<b>${title}</b>`,
    `Заказ №${order.id}`,
    "",
    itemsList,
    "",
    `Итого: ${order.totalPrice} ₽`,
    `Оплата: ${paymentLabel}`,
    "",
    `Имя: ${order.name}`,
    `Телефон: ${order.phone}`,
    `Адрес: ${order.address}`,
    order.lat != null && order.lon != null
      ? `Точка на карте: ${yandexMapPinUrl(order.lat, order.lon)}`
      : undefined,
    order.comment ? `Комментарий: ${order.comment}` : undefined,
  ]
    .filter((line): line is string => line !== undefined)
    .join("\n");
}

export async function notifyNewOrder(order: Order) {
  try {
    await sendTelegramMessage(formatOrderMessage(order, "🆕 Новый заказ"));
  } catch (error) {
    console.error("Не удалось отправить уведомление в Telegram:", error);
  }
}

export async function notifyPaidOrder(order: Order) {
  try {
    await sendTelegramMessage(formatOrderMessage(order, "💳 Заказ оплачен"));
  } catch (error) {
    console.error("Не удалось отправить уведомление в Telegram:", error);
  }
}
