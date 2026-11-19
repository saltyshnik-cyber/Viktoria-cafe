// Идентификаторы акций приходят из Postgres строками (bigint) — приведение
// делает слой доступа. Id блюд и категорий в проекте строковые изначально.

export const PROMOTION_KINDS = [
  "percent_dish",
  "fixed_dish",
  "percent_category",
  "promo_code",
  "second_gift",
  "free_delivery",
  "order_total",
] as const;

export type PromotionKind = (typeof PROMOTION_KINDS)[number];

export const PROMOTION_SCOPES = ["all", "dishes", "categories"] as const;

export type PromotionScope = (typeof PROMOTION_SCOPES)[number];

export const PROMOTION_STATUSES = [
  "active",
  "scheduled",
  "expired",
  "disabled",
] as const;

export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export type Promotion = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  kind: PromotionKind;
  value: number;
  maxDiscount: number | null;
  minOrderTotal: number;
  scope: PromotionScope;
  dishIds: string[];
  categoryIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  /** ISO-дни недели: 1 — понедельник, 7 — воскресенье. null — все дни. */
  weekdays: number[] | null;
  /** «12:00». Если timeTo меньше timeFrom, окно переходит через полночь. */
  timeFrom: string | null;
  timeTo: string | null;
  priority: number;
  stackable: boolean;
  isEnabled: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const BANNER_FREQUENCIES = [
  "once_per_session",
  "once_per_day",
  "once_ever",
  "every_time",
] as const;

export type BannerFrequency = (typeof BANNER_FREQUENCIES)[number];

export type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  imageMobileUrl: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  frequency: BannerFrequency;
  priority: number;
  sortOrder: number;
  isEnabled: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};