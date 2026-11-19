import type { Promotion } from "@/types/promotions";

export const CAFE_TIME_ZONE = "Asia/Krasnoyarsk";

const MINUTE_LIMIT = 24 * 60;
const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};
const WEEKDAY_SHORT = ["", "пн", "вт", "ср", "чт", "пт", "сб", "вс"];

/** Виды акций, которые считаются от цены одного блюда. */
const DISH_KINDS = new Set<Promotion["kind"]>([
  "percent_dish",
  "fixed_dish",
  "percent_category",
]);

export type PricedDishInput = {
  /** Id блюда строковый — так он приходит из menu-store и из тела заказа. */
  id: string;
  categoryId: string;
  price: number;
};

export type PriceOptions = {
  timeZone?: string;
  /**
   * Сумма заказа без скидок. Если не передана (страница меню), порог
   * minOrderTotal не применяется вовсе. В корзине и в заказе передаётся
   * всегда — от базовой суммы, чтобы расчёт не зависел от порядка скидок.
   */
  orderTotal?: number;
};

export type PriceResult = {
  basePrice: number;
  price: number;
  discount: number;
  /** Все сработавшие акции, от большей выгоды к меньшей. */
  appliedPromotionIds: number[];
  /** Главная акция — её id сохраняется в заказе. */
  appliedPromotionId: number | null;
  /** Готовая подпись бейджа: «−20%» или «−150 ₽». */
  badge: string | null;
  /** Готовая подпись под ценой: «по будням, 12:00–16:00» или «Акция: …». */
  label: string | null;
};

export type CartLineInput = PricedDishInput & { quantity: number };

export type PricedLine = {
  id: string;
  categoryId: string;
  quantity: number;
  basePrice: number;
  price: number;
  discount: number;
  promotionId: number | null;
  badge: string | null;
  label: string | null;
};

type Candidate = { promotion: Promotion; discount: number };
type Offer = { discount: number; priority: number; promotions: Candidate[] };

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number): string {
  const rounded = roundMoney(value);
  const withFraction = Math.abs(rounded % 1) > 0.001;
  const [integerPart, fractionPart] = rounded.toFixed(withFraction ? 2 : 0).split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return fractionPart ? `${grouped},${fractionPart}\u00a0₽` : `${grouped}\u00a0₽`;
}

function formatDate(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
  }).format(value);
}

function shortTime(value: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;

  const [hours, minutes] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (!Number.isInteger(parsedHours) || !Number.isInteger(parsedMinutes)) return null;
  if (parsedMinutes < 0 || parsedMinutes > 59) return null;
  if (parsedHours === 24) return parsedMinutes === 0 ? MINUTE_LIMIT : null;
  if (parsedHours < 0 || parsedHours > 23) return null;

  return parsedHours * 60 + parsedMinutes;
}

export type LocalMoment = { weekday: number; minutes: number };

export function getLocalMoment(now: Date, timeZone: string): LocalMoment {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekdayName = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    weekday: WEEKDAY_INDEX[weekdayName] ?? 1,
    minutes: (hour % 24) * 60 + minute,
  };
}

function matchesWeekday(days: number[] | null, weekday: number): boolean {
  return !days || days.includes(weekday);
}

export function matchesSchedule(promotion: Promotion, moment: LocalMoment): boolean {
  const from = parseTimeToMinutes(promotion.timeFrom);
  const to = parseTimeToMinutes(promotion.timeTo);

  const allDay = (from === null && to === null) || (from !== null && from === to);
  if (allDay) {
    return matchesWeekday(promotion.weekdays, moment.weekday);
  }

  // Окно через полночь: вечер принадлежит текущему дню, утро — предыдущему.
  if (from !== null && to !== null && from > to) {
    const previousDay = moment.weekday === 1 ? 7 : moment.weekday - 1;
    const evening = matchesWeekday(promotion.weekdays, moment.weekday) && moment.minutes >= from;
    const morning = matchesWeekday(promotion.weekdays, previousDay) && moment.minutes < to;
    return evening || morning;
  }

  const start = from ?? 0;
  const end = to ?? MINUTE_LIMIT;

  return (
    matchesWeekday(promotion.weekdays, moment.weekday) &&
    moment.minutes >= start &&
    moment.minutes < end
  );
}

export function isPromotionActiveAt(
  promotion: Promotion,
  now: Date,
  moment: LocalMoment,
): boolean {
  if (!promotion.isEnabled) return false;
  if (promotion.startsAt && now.getTime() < promotion.startsAt.getTime()) return false;
  if (promotion.endsAt && now.getTime() >= promotion.endsAt.getTime()) return false;
  return matchesSchedule(promotion, moment);
}

export function isPromotionActive(
  promotion: Promotion,
  now: Date,
  timeZone: string = CAFE_TIME_ZONE,
): boolean {
  return isPromotionActiveAt(promotion, now, getLocalMoment(now, timeZone));
}

function appliesToDish(promotion: Promotion, dish: PricedDishInput): boolean {
  if (promotion.scope === "all") return true;
  if (promotion.scope === "dishes") return promotion.dishIds.includes(dish.id);
  return promotion.categoryIds.includes(dish.categoryId);
}

function discountForDish(promotion: Promotion, price: number): number {
  let discount: number;

  switch (promotion.kind) {
    case "percent_dish":
    case "percent_category":
      discount = price * (promotion.value / 100);
      break;
    case "fixed_dish":
      discount = promotion.value;
      break;
    default:
      return 0;
  }

  if (promotion.maxDiscount !== null) {
    discount = Math.min(discount, promotion.maxDiscount);
  }

  return roundMoney(Math.min(discount, price));
}

function buildOffer(candidates: Candidate[], basePrice: number): Offer {
  const rawDiscount = candidates.reduce((total, item) => total + item.discount, 0);

  return {
    discount: roundMoney(Math.min(rawDiscount, basePrice)),
    priority: Math.max(...candidates.map((item) => item.promotion.priority)),
    promotions: candidates,
  };
}

function isBetterOffer(candidate: Offer, current: Offer | null): boolean {
  if (!current) return true;
  if (candidate.discount !== current.discount) return candidate.discount > current.discount;
  if (candidate.priority !== current.priority) return candidate.priority > current.priority;

  // Ровный результат — оставляем более простое объяснение для гостя.
  return candidate.promotions.length < current.promotions.length;
}

function describeWeekdays(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);

  if (sorted.length === 5 && sorted.every((day, index) => day === index + 1)) {
    return "по будням";
  }
  if (sorted.length === 2 && sorted[0] === 6 && sorted[1] === 7) {
    return "по выходным";
  }
  if (sorted.length === 7) {
    return "ежедневно";
  }

  return `по ${sorted.map((day) => WEEKDAY_SHORT[day]).join(", ")}`;
}

export function describeSchedule(
  promotion: Promotion,
  timeZone: string = CAFE_TIME_ZONE,
): string {
  const parts: string[] = [];

  if (promotion.weekdays && promotion.weekdays.length > 0) {
    parts.push(describeWeekdays(promotion.weekdays));
  }

  if (promotion.timeFrom && promotion.timeTo) {
    parts.push(`${shortTime(promotion.timeFrom)}–${shortTime(promotion.timeTo)}`);
  } else if (promotion.timeTo) {
    parts.push(`до ${shortTime(promotion.timeTo)}`);
  } else if (promotion.timeFrom) {
    parts.push(`с ${shortTime(promotion.timeFrom)}`);
  }

  if (promotion.endsAt) {
    parts.push(`до ${formatDate(promotion.endsAt, timeZone)}`);
  }

  if (promotion.minOrderTotal > 0) {
    parts.push(`при заказе от ${formatMoney(promotion.minOrderTotal)}`);
  }

  return parts.join(", ");
}

function buildBadge(offer: Offer, basePrice: number): string {
  if (offer.promotions.length === 1) {
    const { promotion, discount } = offer.promotions[0];
    const isPercent =
      promotion.kind === "percent_dish" || promotion.kind === "percent_category";
    const notCapped =
      promotion.maxDiscount === null || discount < roundMoney(promotion.maxDiscount) - 0.001;

    if (isPercent && notCapped) {
      return `−${promotion.value}%`;
    }
  }

  return `−${formatMoney(offer.discount)}`;
}

function buildLabel(offer: Offer, timeZone: string): string {
  if (offer.promotions.length > 1) {
    const titles = offer.promotions.map((item) => item.promotion.title).join(", ");
    return `Акции: ${titles}`;
  }

  const promotion = offer.promotions[0].promotion;
  const schedule = describeSchedule(promotion, timeZone);

  return schedule ? schedule : `Акция: ${promotion.title}`;
}

function emptyResult(basePrice: number): PriceResult {
  return {
    basePrice,
    price: basePrice,
    discount: 0,
    appliedPromotionIds: [],
    appliedPromotionId: null,
    badge: null,
    label: null,
  };
}

export function computePrice(
  dish: PricedDishInput,
  now: Date,
  promotions: Promotion[],
  options: PriceOptions = {},
): PriceResult {
  const basePrice = roundMoney(Math.max(0, dish.price));
  if (basePrice <= 0) return emptyResult(basePrice);

  const timeZone = options.timeZone ?? CAFE_TIME_ZONE;
  const moment = getLocalMoment(now, timeZone);

  const candidates: Candidate[] = [];

  for (const promotion of promotions) {
    if (!DISH_KINDS.has(promotion.kind)) continue;
    if (!isPromotionActiveAt(promotion, now, moment)) continue;
    if (!appliesToDish(promotion, dish)) continue;
    if (options.orderTotal !== undefined && promotion.minOrderTotal > options.orderTotal) {
      continue;
    }

    const discount = discountForDish(promotion, basePrice);
    if (discount > 0) candidates.push({ promotion, discount });
  }

  if (candidates.length === 0) return emptyResult(basePrice);

  const stackable = candidates.filter((item) => item.promotion.stackable);
  const offers: Offer[] = [];

  if (stackable.length > 0) {
    offers.push(buildOffer(stackable, basePrice));
  }
  for (const single of candidates.filter((item) => !item.promotion.stackable)) {
    offers.push(buildOffer([single], basePrice));
  }

  let best: Offer | null = null;
  for (const offer of offers) {
    if (isBetterOffer(offer, best)) best = offer;
  }

  if (!best) return emptyResult(basePrice);

  const sorted = [...best.promotions].sort(
    (a, b) => b.discount - a.discount || b.promotion.priority - a.promotion.priority,
  );

  return {
    basePrice,
    price: roundMoney(Math.max(0, basePrice - best.discount)),
    discount: best.discount,
    appliedPromotionIds: sorted.map((item) => item.promotion.id),
    appliedPromotionId: sorted[0].promotion.id,
    badge: buildBadge(best, basePrice),
    label: buildLabel(best, timeZone),
  };
}

/**
 * Считает цены всех позиций корзины. Порог minOrderTotal сверяется с базовой
 * суммой корзины (до скидок) — так расчёт не зависит от порядка применения
 * акций и совпадает на клиенте и на сервере.
 */
export function priceCartLines(
  lines: CartLineInput[],
  now: Date,
  promotions: Promotion[],
  options: PriceOptions = {},
): PricedLine[] {
  const orderTotal = roundMoney(
    lines.reduce((sum, line) => sum + Math.max(0, line.price) * line.quantity, 0),
  );

  return lines.map((line) => {
    const result = computePrice(line, now, promotions, { ...options, orderTotal });

    return {
      id: line.id,
      categoryId: line.categoryId,
      quantity: line.quantity,
      basePrice: result.basePrice,
      price: result.price,
      discount: roundMoney(result.discount * line.quantity),
      promotionId: result.appliedPromotionId,
      badge: result.badge,
      label: result.label,
    };
  });
}

export function sumLines(lines: PricedLine[]): {
  base: number;
  subtotal: number;
  itemsDiscount: number;
} {
  const base = roundMoney(lines.reduce((sum, line) => sum + line.basePrice * line.quantity, 0));
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  return { base, subtotal, itemsDiscount: roundMoney(base - subtotal) };
}