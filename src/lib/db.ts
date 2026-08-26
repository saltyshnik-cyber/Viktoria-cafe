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
          price INTEGER NOT NULL,
          is_popular BOOLEAN NOT NULL DEFAULT FALSE,
          photo_url TEXT NOT NULL DEFAULT '',
          is_available BOOLEAN NOT NULL DEFAULT TRUE
        )
      `;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE`;
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT NOT NULL,
          comment TEXT,
          items JSONB NOT NULL,
          total_price INTEGER NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT NOT NULL,
          payment_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
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
    })();
  }
  return schemaReady;
}
