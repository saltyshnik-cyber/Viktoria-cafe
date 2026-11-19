import { ensureSchema, sql } from "@/lib/db";
import type { Promotion, PromotionKind, PromotionScope } from "@/types/promotions";

// Клиент базы берём из src/lib/db.ts — второго экземпляра быть не должно.

type PromotionRow = {
  id: string | number;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  kind: PromotionKind;
  value: string | number;
  max_discount: string | number | null;
  min_order_total: string | number;
  scope: PromotionScope;
  starts_at: Date | string | null;
  ends_at: Date | string | null;
  weekdays: Array<string | number> | null;
  time_from: string | null;
  time_to: string | null;
  priority: string | number;
  stackable: boolean;
  is_enabled: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  dish_ids: Array<string | number> | null;
  category_ids: Array<string | number> | null;
};

export type PromotionInput = {
  slug?: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  kind: PromotionKind;
  value: number;
  maxDiscount?: number | null;
  minOrderTotal?: number;
  scope: PromotionScope;
  dishIds?: string[];
  categoryIds?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  weekdays?: number[] | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  priority?: number;
  stackable?: boolean;
  isEnabled?: boolean;
  updatedBy?: string | null;
};

const PROMOTION_SELECT = `
  p.id, p.slug, p.title, p.description, p.image_url, p.kind, p.value,
  p.max_discount, p.min_order_total, p.scope, p.starts_at, p.ends_at,
  p.weekdays, p.time_from, p.time_to, p.priority, p.stackable, p.is_enabled,
  p.created_by, p.updated_by, p.created_at, p.updated_at,
  array_remove(array_agg(distinct pd.dish_id), null) as dish_ids,
  array_remove(array_agg(distinct pc.category_id), null) as category_ids
`;

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

function toNumberOrNull(value: string | number | null): number | null {
  return value === null ? null : toNumber(value);
}

function toDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function toDateRequired(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function toTime(value: string | null): string | null {
  return value ? value.slice(0, 5) : null;
}

/** Id блюд и категорий остаются строками — такими они живут в меню. */
function toStringList(values: Array<string | number> | null): string[] {
  return (values ?? []).map(String);
}

function mapPromotionRow(row: PromotionRow): Promotion {
  return {
    id: toNumber(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    kind: row.kind,
    value: toNumber(row.value),
    maxDiscount: toNumberOrNull(row.max_discount),
    minOrderTotal: toNumber(row.min_order_total),
    scope: row.scope,
    dishIds: toStringList(row.dish_ids),
    categoryIds: toStringList(row.category_ids),
    startsAt: toDate(row.starts_at),
    endsAt: toDate(row.ends_at),
    weekdays: row.weekdays ? row.weekdays.map(toNumber) : null,
    timeFrom: toTime(row.time_from),
    timeTo: toTime(row.time_to),
    priority: toNumber(row.priority),
    stackable: row.stackable,
    isEnabled: row.is_enabled,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: toDateRequired(row.created_at),
    updatedAt: toDateRequired(row.updated_at),
  };
}

/** jsonb → text[]: так параметр-массив не зависит от разметки драйвера. */
function textArray(list: string[]): string {
  return JSON.stringify(list);
}

function intArray(list: number[]): string {
  return JSON.stringify(list);
}

/** Включённые акции, чьё окно дат покрывает переданный момент. */
export async function getDishPromotions(now: Date = new Date()): Promise<Promotion[]> {
  await ensureSchema();
  const isoNow = now.toISOString();

  const rows = await sql`
    select ${sql.unsafe(PROMOTION_SELECT)}
    from promotions p
    left join promotion_dishes pd on pd.promotion_id = p.id
    left join promotion_categories pc on pc.promotion_id = p.id
    where p.is_enabled
      and (p.starts_at is null or p.starts_at <= ${isoNow}::timestamptz)
      and (p.ends_at is null or p.ends_at > ${isoNow}::timestamptz)
    group by p.id
    order by p.priority desc, p.id
  `;

  return (rows as unknown as PromotionRow[]).map(mapPromotionRow);
}

/** Все акции для админки, включая выключенные и просроченные. */
export async function getAllPromotions(): Promise<Promotion[]> {
  await ensureSchema();

  const rows = await sql`
    select ${sql.unsafe(PROMOTION_SELECT)}
    from promotions p
    left join promotion_dishes pd on pd.promotion_id = p.id
    left join promotion_categories pc on pc.promotion_id = p.id
    group by p.id
    order by p.priority desc, p.id
  `;

  return (rows as unknown as PromotionRow[]).map(mapPromotionRow);
}

export async function getPromotionById(id: number): Promise<Promotion | undefined> {
  await ensureSchema();

  const rows = await sql`
    select ${sql.unsafe(PROMOTION_SELECT)}
    from promotions p
    left join promotion_dishes pd on pd.promotion_id = p.id
    left join promotion_categories pc on pc.promotion_id = p.id
    where p.id = ${id}
    group by p.id
  `;

  const mapped = (rows as unknown as PromotionRow[]).map(mapPromotionRow);
  return mapped[0];
}

function autoSlug(title: string): string {
  const translit: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  const base = title
    .toLowerCase()
    .split("")
    .map((char) => translit[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `${base || "promo"}-${Date.now().toString(36)}`;
}

async function replaceLinks(promotionId: number, input: PromotionInput): Promise<void> {
  await sql`delete from promotion_dishes where promotion_id = ${promotionId}`;
  await sql`delete from promotion_categories where promotion_id = ${promotionId}`;

  const dishIds = input.scope === "dishes" ? (input.dishIds ?? []) : [];
  const categoryIds = input.scope === "categories" ? (input.categoryIds ?? []) : [];

  if (dishIds.length > 0) {
    await sql`
      insert into promotion_dishes (promotion_id, dish_id)
      select ${promotionId}, value
      from jsonb_array_elements_text(${textArray(dishIds)}::jsonb) as value
      on conflict do nothing
    `;
  }

  if (categoryIds.length > 0) {
    await sql`
      insert into promotion_categories (promotion_id, category_id)
      select ${promotionId}, value
      from jsonb_array_elements_text(${textArray(categoryIds)}::jsonb) as value
      on conflict do nothing
    `;
  }
}

export async function createPromotion(input: PromotionInput): Promise<Promotion | undefined> {
  await ensureSchema();

  const weekdays = input.weekdays && input.weekdays.length > 0 ? input.weekdays : null;
  const slug = input.slug?.trim() || autoSlug(input.title);

  const rows = await sql`
    insert into promotions (
      slug, title, description, image_url, kind, value, max_discount, min_order_total,
      scope, starts_at, ends_at, weekdays, time_from, time_to, priority, stackable,
      is_enabled, updated_by
    )
    values (
      ${slug}, ${input.title}, ${input.description ?? null}, ${input.imageUrl ?? null},
      ${input.kind}, ${input.value}, ${input.maxDiscount ?? null}, ${input.minOrderTotal ?? 0},
      ${input.scope}, ${input.startsAt ?? null}::timestamptz, ${input.endsAt ?? null}::timestamptz,
      ${weekdays ? sql`ARRAY(SELECT jsonb_array_elements_text(${intArray(weekdays)}::jsonb))::smallint[]` : null},
      ${input.timeFrom ?? null}::time, ${input.timeTo ?? null}::time,
      ${input.priority ?? 0}, ${input.stackable ?? false}, ${input.isEnabled ?? true},
      ${input.updatedBy ?? null}
    )
    returning id
  `;

  const id = toNumber((rows[0] as { id: string | number }).id);
  await replaceLinks(id, input);
  return getPromotionById(id);
}

export async function updatePromotion(
  id: number,
  input: PromotionInput,
): Promise<Promotion | undefined> {
  await ensureSchema();

  const weekdays = input.weekdays && input.weekdays.length > 0 ? input.weekdays : null;

  const rows = await sql`
    update promotions set
      title = ${input.title},
      description = ${input.description ?? null},
      image_url = ${input.imageUrl ?? null},
      kind = ${input.kind},
      value = ${input.value},
      max_discount = ${input.maxDiscount ?? null},
      min_order_total = ${input.minOrderTotal ?? 0},
      scope = ${input.scope},
      starts_at = ${input.startsAt ?? null}::timestamptz,
      ends_at = ${input.endsAt ?? null}::timestamptz,
      weekdays = ${weekdays ? sql`ARRAY(SELECT jsonb_array_elements_text(${intArray(weekdays)}::jsonb))::smallint[]` : null},
      time_from = ${input.timeFrom ?? null}::time,
      time_to = ${input.timeTo ?? null}::time,
      priority = ${input.priority ?? 0},
      stackable = ${input.stackable ?? false},
      is_enabled = ${input.isEnabled ?? true},
      updated_by = ${input.updatedBy ?? null},
      updated_at = now()
    where id = ${id}
    returning id
  `;

  if (rows.length === 0) return undefined;

  await replaceLinks(id, input);
  return getPromotionById(id);
}

export async function setPromotionEnabled(
  id: number,
  isEnabled: boolean,
): Promise<Promotion | undefined> {
  await ensureSchema();

  const rows = await sql`
    update promotions set is_enabled = ${isEnabled}, updated_at = now()
    where id = ${id}
    returning id
  `;

  if (rows.length === 0) return undefined;
  return getPromotionById(id);
}

export async function deletePromotion(id: number): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`delete from promotions where id = ${id} returning id`;
  return rows.length > 0;
}