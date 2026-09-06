import type { MenuCategory } from "@/types/menu";
import { sql, ensureSchema } from "@/lib/db";

const SEED_CATEGORIES: MenuCategory[] = [
  { id: "shashlik", name: "Шашлыки", emoji: "🍢" },
  { id: "garnish", name: "Гарниры", emoji: "🥔" },
  { id: "salads", name: "Салаты и закуски", emoji: "🥗" },
  { id: "drinks", name: "Напитки", emoji: "🥤" },
  { id: "extra", name: "Дополнительно", emoji: "🫔" },
  { id: "khachapuri", name: "Хачапури", emoji: "🫓" },
  { id: "combo", name: "Комбо", emoji: "🍱" },
];

type CategoryRow = { id: string; name: string; emoji: string; sort_order: number };

function rowToCategory(row: CategoryRow): MenuCategory {
  return { id: row.id, name: row.name, emoji: row.emoji };
}

let seedReady: Promise<void> | null = null;

function ready(): Promise<void> {
  if (!seedReady) {
    seedReady = (async () => {
      await ensureSchema();
      const rows = (await sql`SELECT COUNT(*)::int AS count FROM categories`) as {
        count: number;
      }[];
      if (rows[0].count > 0) return;

      for (let i = 0; i < SEED_CATEGORIES.length; i++) {
        const category = SEED_CATEGORIES[i];
        await sql`
          INSERT INTO categories (id, name, emoji, sort_order)
          VALUES (${category.id}, ${category.name}, ${category.emoji}, ${i})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })();
  }
  return seedReady;
}

export async function getCategories(): Promise<MenuCategory[]> {
  await ready();
  const rows = (await sql`
    SELECT * FROM categories ORDER BY sort_order, name
  `) as CategoryRow[];
  return rows.map(rowToCategory);
}

export async function createCategory(data: {
  name: string;
  emoji: string;
}): Promise<MenuCategory> {
  await ready();
  const id = crypto.randomUUID().slice(0, 8);
  const rows = (await sql`
    SELECT COALESCE(MAX(sort_order), -1)::int AS max FROM categories
  `) as { max: number }[];
  const sortOrder = rows[0].max + 1;

  await sql`
    INSERT INTO categories (id, name, emoji, sort_order)
    VALUES (${id}, ${data.name}, ${data.emoji}, ${sortOrder})
  `;
  return { id, name: data.name, emoji: data.emoji };
}

export async function updateCategory(
  id: string,
  data: { name: string; emoji: string },
): Promise<MenuCategory | undefined> {
  await ready();
  const rows = (await sql`
    UPDATE categories SET name = ${data.name}, emoji = ${data.emoji}
    WHERE id = ${id}
    RETURNING id
  `) as { id: string }[];
  if (rows.length === 0) return undefined;
  return { id, name: data.name, emoji: data.emoji };
}

export async function moveCategory(
  id: string,
  direction: "up" | "down",
): Promise<boolean> {
  await ready();
  const rows = (await sql`
    SELECT id, sort_order FROM categories ORDER BY sort_order, name
  `) as { id: string; sort_order: number }[];

  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return false;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= rows.length) return false;

  const a = rows[index];
  const b = rows[swapIndex];
  await sql`UPDATE categories SET sort_order = ${b.sort_order} WHERE id = ${a.id}`;
  await sql`UPDATE categories SET sort_order = ${a.sort_order} WHERE id = ${b.id}`;
  return true;
}

export async function deleteCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; itemCount: number }> {
  await ready();
  const rows = (await sql`
    SELECT COUNT(*)::int AS count FROM menu_items WHERE category_id = ${id}
  `) as { count: number }[];

  if (rows[0].count > 0) {
    return { ok: false, itemCount: rows[0].count };
  }

  await sql`DELETE FROM categories WHERE id = ${id}`;
  return { ok: true };
}
