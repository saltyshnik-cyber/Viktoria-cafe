import type { MenuItem } from "@/types/menu";
import { sql, ensureSchema } from "@/lib/db";

const SEED_ITEMS: MenuItem[] = [
  {
    id: "soup-borsch",
    categoryId: "soups",
    name: "Борщ со сметаной",
    description: "Наваристый борщ на говяжьем бульоне, подаётся со сметаной и чесночным пампушком",
    weight: "350 г",
    price: 320,
    isPopular: true,
  },
  {
    id: "soup-solyanka",
    categoryId: "soups",
    name: "Солянка мясная",
    description: "Копчёности, оливки, лимон — насыщенный сборный суп",
    weight: "320 г",
    price: 350,
  },
  {
    id: "soup-cream-mushroom",
    categoryId: "soups",
    name: "Крем-суп из шампиньонов",
    description: "Нежный суп-пюре со сливками и гренками",
    weight: "300 г",
    price: 290,
  },
  {
    id: "salad-caesar",
    categoryId: "salads",
    name: "Цезарь с курицей",
    description: "Романо, куриное филе гриль, пармезан, соус цезарь, гренки",
    weight: "250 г",
    price: 380,
    isPopular: true,
  },
  {
    id: "salad-greek",
    categoryId: "salads",
    name: "Греческий салат",
    description: "Свежие овощи, сыр фета, оливки, оливковое масло",
    weight: "230 г",
    price: 340,
  },
  {
    id: "salad-vitamin",
    categoryId: "salads",
    name: "Витаминный салат",
    description: "Капуста, морковь, огурец, зелень, семена кунжута",
    weight: "220 г",
    price: 250,
  },
  {
    id: "hot-chicken-kiev",
    categoryId: "hot",
    name: "Котлета по-киевски",
    description: "С картофельным пюре и овощами на пару",
    weight: "300 г",
    price: 420,
    isPopular: true,
  },
  {
    id: "hot-beef-stroganoff",
    categoryId: "hot",
    name: "Бефстроганов",
    description: "Говядина в сливочном соусе с картофельным пюре",
    weight: "320 г",
    price: 450,
  },
  {
    id: "hot-salmon",
    categoryId: "hot",
    name: "Лосось на пару с овощами",
    description: "Филе лосося, брокколи, спаржа, соус из белого вина",
    weight: "280 г",
    price: 590,
  },
  {
    id: "pizza-margherita",
    categoryId: "pizza",
    name: "Маргарита",
    description: "Томатный соус, моцарелла, базилик",
    weight: "450 г",
    price: 450,
  },
  {
    id: "pizza-pepperoni",
    categoryId: "pizza",
    name: "Пепперони",
    description: "Острая пепперони, моцарелла, томатный соус",
    weight: "480 г",
    price: 520,
    isPopular: true,
  },
  {
    id: "pizza-four-cheese",
    categoryId: "pizza",
    name: "Четыре сыра",
    description: "Моцарелла, дор блю, пармезан, чеддер",
    weight: "460 г",
    price: 560,
  },
  {
    id: "burger-classic",
    categoryId: "burgers",
    name: "Классический бургер",
    description: "Говяжья котлета, чеддер, соус бургер, свежие овощи",
    weight: "280 г",
    price: 390,
    isPopular: true,
  },
  {
    id: "burger-chicken",
    categoryId: "burgers",
    name: "Чикен бургер",
    description: "Хрустящее куриное филе, айсберг, соус ранч",
    weight: "270 г",
    price: 360,
  },
  {
    id: "drink-lemonade",
    categoryId: "drinks",
    name: "Домашний лимонад",
    description: "Цитрусовый лимонад с мятой",
    weight: "400 мл",
    price: 220,
  },
  {
    id: "drink-cappuccino",
    categoryId: "drinks",
    name: "Капучино",
    description: "Классический капучино на отборных зёрнах",
    weight: "300 мл",
    price: 190,
    isPopular: true,
  },
  {
    id: "drink-compote",
    categoryId: "drinks",
    name: "Морс ягодный",
    description: "Домашний морс из сезонных ягод",
    weight: "350 мл",
    price: 170,
  },
  {
    id: "dessert-cheesecake",
    categoryId: "desserts",
    name: "Чизкейк Нью-Йорк",
    description: "Классический чизкейк со сливочным сыром",
    weight: "150 г",
    price: 280,
    isPopular: true,
  },
  {
    id: "dessert-tiramisu",
    categoryId: "desserts",
    name: "Тирамису",
    description: "Итальянский десерт с маскарпоне и кофе",
    weight: "150 г",
    price: 300,
  },
];

type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  weight: string;
  price: number;
  is_popular: boolean;
};

function rowToItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    weight: row.weight,
    price: row.price,
    isPopular: row.is_popular,
  };
}

let seedReady: Promise<void> | null = null;

function ready(): Promise<void> {
  if (!seedReady) {
    seedReady = (async () => {
      await ensureSchema();
      const rows = (await sql`SELECT COUNT(*)::int AS count FROM menu_items`) as {
        count: number;
      }[];
      if (rows[0].count > 0) return;

      for (const item of SEED_ITEMS) {
        await sql`
          INSERT INTO menu_items (id, category_id, name, description, weight, price, is_popular)
          VALUES (${item.id}, ${item.categoryId}, ${item.name}, ${item.description}, ${item.weight}, ${item.price}, ${item.isPopular ?? false})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    })();
  }
  return seedReady;
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  await ready();
  const rows = (await sql`
    SELECT * FROM menu_items ORDER BY category_id, name
  `) as MenuItemRow[];
  return rows.map(rowToItem);
}

export async function getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
  await ready();
  const rows = (await sql`
    SELECT * FROM menu_items WHERE category_id = ${categoryId} ORDER BY name
  `) as MenuItemRow[];
  return rows.map(rowToItem);
}

export async function createMenuItem(data: Omit<MenuItem, "id">): Promise<MenuItem> {
  await ready();
  const id = crypto.randomUUID().slice(0, 8);
  await sql`
    INSERT INTO menu_items (id, category_id, name, description, weight, price, is_popular)
    VALUES (${id}, ${data.categoryId}, ${data.name}, ${data.description}, ${data.weight}, ${data.price}, ${data.isPopular ?? false})
  `;
  return { ...data, id };
}

export async function updateMenuItem(
  id: string,
  data: Omit<MenuItem, "id">,
): Promise<MenuItem | undefined> {
  await ready();
  const rows = (await sql`
    UPDATE menu_items
    SET category_id = ${data.categoryId}, name = ${data.name}, description = ${data.description},
        weight = ${data.weight}, price = ${data.price}, is_popular = ${data.isPopular ?? false}
    WHERE id = ${id}
    RETURNING id
  `) as { id: string }[];
  if (rows.length === 0) return undefined;
  return { ...data, id };
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  await ready();
  const rows = (await sql`DELETE FROM menu_items WHERE id = ${id} RETURNING id`) as {
    id: string;
  }[];
  return rows.length > 0;
}
