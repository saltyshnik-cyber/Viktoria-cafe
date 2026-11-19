import { neon } from "@neondatabase/serverless";
import type { Promotion, PromotionKind, PromotionScope } from "@/types/promotions";

// Единственное место, где создаётся клиент Neon для акций. neon() не держит
// соединений — каждый запрос это отдельный HTTP-вызов, поэтому экземпляр
// рядом с src/lib/db.ts ничего не исчерпывает. Если захочешь переиспользовать
// свой клиент — замени resolveSql на его импорт, остальной файл не меняется.

type SqlClient = ReturnType<typeof neon>;

const CONNECTION_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "NEON_DATABASE_URL",
  "POSTGRES_PRISMA_URL",
];

let client: SqlClient | null = null;

function resolveConnectionString(): string {
  for (const key of CONNECTION_ENV_KEYS) {
    const value = process.env[key];
    if (value) return value;
  }

  throw new Error(
    `Не найдена строка подключения к базе. Проверь одну из переменных: ${CONNECTION_ENV_KEYS.join(", ")}`,
  );
}

export function resolveSql(): SqlClient {
  if (!client) client = neon(resolveConnectionString());
  return client;
}

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

/** Включённые акции, чьё окно дат покрывает переданный момент. */
export async function getDishPromotions(now: Date = new Date()): Promise<Promotion[]> {
  const sql = resolveSql();
  const isoNow = now.toISOString();

  const rows = await sql`
    select
      p.id, p.slug, p.title, p.description, p.image_url, p.kind, p.value,
      p.max_discount, p.min_order_total, p.scope, p.starts_at, p.ends_at,
      p.weekdays, p.time_from, p.time_to, p.priority, p.stackable, p.is_enabled,
      p.created_by, p.updated_by, p.created_at, p.updated_at,
      array_remove(array_agg(distinct pd.dish_id), null) as dish_ids,
      array_remove(array_agg(distinct pc.category_id), null) as category_ids
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
  const sql = resolveSql();

  const rows = await sql`
    select
      p.id, p.slug, p.title, p.description, p.image_url, p.kind, p.value,
      p.max_discount, p.min_order_total, p.scope, p.starts_at, p.ends_at,
      p.weekdays, p.time_from, p.time_to, p.priority, p.stackable, p.is_enabled,
      p.created_by, p.updated_by, p.created_at, p.updated_at,
      array_remove(array_agg(distinct pd.dish_id), null) as dish_ids,
      array_remove(array_agg(distinct pc.category_id), null) as category_ids
    from promotions p
    left join promotion_dishes pd on pd.promotion_id = p.id
    left join promotion_categories pc on pc.promotion_id = p.id
    group by p.id
    order by p.priority desc, p.id
  `;

  return (rows as unknown as PromotionRow[]).map(mapPromotionRow);
}