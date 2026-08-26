export function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  return `tel:+${normalized}`;
}
