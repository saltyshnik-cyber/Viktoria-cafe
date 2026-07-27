// Общие правила валидации формы заказа — используются и на клиенте (для
// подсказок под полями), и на сервере (чтобы нельзя было обойти проверку,
// отключив JS или отправив запрос напрямую).

export const PHONE_PATTERN = /^\+7\d{10}$/;

export function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

export function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function isValidPhone(value: string | undefined | null): boolean {
  if (!value) return false;
  return PHONE_PATTERN.test(normalizePhone(value));
}
