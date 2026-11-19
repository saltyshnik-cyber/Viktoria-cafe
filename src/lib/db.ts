import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "Не задана строка подключения к базе данных: заполните DATABASE_URL (или POSTGRES_URL) в .env",
  );
}

export const sql = neon(connectionString);

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS menu_items (
          id TEXT PRIMARY KEY,
          category_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          weight TEXT NOT NULL DEFAULT '',
          price INTEGER,
          is_popular BOOLEAN NOT NULL DEFAULT FALSE,
          photo_url TEXT NOT NULL DEFAULT '',
          is_available BOOLEAN NOT NULL DEFAULT TRUE
        )
      `;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE`;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sauce_options JSONB NOT NULL DEFAULT '[]'::jsonb`;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS composition JSONB NOT NULL DEFAULT '[]'::jsonb`;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS gallery_photos JSONB NOT NULL DEFAULT '[]'::jsonb`;
      // Цена теперь необязательна при создании — можно быстро занести
      // блюдо по названию и категории, дозаполнив остальное позже.
      await sql`ALTER TABLE menu_items ALTER COLUMN price DROP NOT NULL`;
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT NOT NULL,
          lat DOUBLE PRECISION,
          lon DOUBLE PRECISION,
          comment TEXT,
          items JSONB NOT NULL,
          total_price INTEGER NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT NOT NULL,
          payment_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION`;
      // Все заказы, созданные до появления самовывоза, были доставкой — DEFAULT
      // проставляет это существующим строкам, сами строки не меняются.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'delivery'`;
      // До этого доставка в итог не входила: у прежних заказов 0, а total_price
      // остаётся ровно той суммой, которую гости тогда и оплатили.
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0`;
      // Скидки уровня заказа — колонками, а не в jsonb: по ним нужны sum()
      // за период и фильтр «заказы с акцией N».
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_discount NUMERIC(10, 2) NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_promotion_ids BIGINT[] NOT NULL DEFAULT '{}'`;
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          emoji TEXT NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          date_label TEXT NOT NULL DEFAULT '',
          rating INTEGER NOT NULL DEFAULT 5,
          text TEXT NOT NULL DEFAULT '',
          check_amount TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          seq SERIAL
        )
      `;
      await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seq SERIAL`;

      // Акции. dish_id и category_id — TEXT: id блюд и категорий в проекте
      // строковые (menu_items.id, categories.id).
      await sql`
        CREATE TABLE IF NOT EXISTS promotions (
          id BIGSERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          kind TEXT NOT NULL,
          value NUMERIC(10, 2) NOT NULL DEFAULT 0,
          max_discount NUMERIC(10, 2),
          min_order_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
          scope TEXT NOT NULL DEFAULT 'all',
          starts_at TIMESTAMPTZ,
          ends_at TIMESTAMPTZ,
          weekdays SMALLINT[],
          time_from TIME,
          time_to TIME,
          priority INTEGER NOT NULL DEFAULT 0,
          stackable BOOLEAN NOT NULL DEFAULT FALSE,
          is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS promotion_dishes (
          promotion_id BIGINT NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
          dish_id TEXT NOT NULL,
          PRIMARY KEY (promotion_id, dish_id)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS promotion_categories (
          promotion_id BIGINT NOT NULL REFERENCES promotions (id) ON DELETE CASCADE,
          category_id TEXT NOT NULL,
          PRIMARY KEY (promotion_id, category_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS promotions_active_idx ON promotions (is_enabled, priority DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS promotion_dishes_dish_idx ON promotion_dishes (dish_id)`;
      await sql`CREATE INDEX IF NOT EXISTS promotion_categories_category_idx ON promotion_categories (category_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS banners (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          subtitle TEXT,
          image_url TEXT,
          image_mobile_url TEXT,
          button_label TEXT,
          button_url TEXT,
          starts_at TIMESTAMPTZ,
          ends_at TIMESTAMPTZ,
          frequency TEXT NOT NULL DEFAULT 'once_per_session',
          priority INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS banners_active_idx ON banners (is_enabled, priority DESC, sort_order)`;
    })();
  }
  return schemaReady;
}