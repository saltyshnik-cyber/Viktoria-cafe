// Часы приёма заказов — по времени Красноярска (UTC+7, без перехода на
// летнее/зимнее время), независимо от часового пояса сервера или клиента.
export const BUSINESS_HOURS_TIMEZONE = "Asia/Krasnoyarsk";
export const OPEN_HOUR = 12;
export const CLOSE_HOUR = 24;

export const CLOSED_ORDER_MESSAGE =
  "Приём заказов с 12:00 до 00:00. Сейчас мы не работаем — оформить заказ можно после открытия.";

export function getHourInTimeZone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  });
  return Number(formatter.format(date));
}

export function isWithinBusinessHours(date: Date = new Date()): boolean {
  const hour = getHourInTimeZone(date, BUSINESS_HOURS_TIMEZONE);
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}
