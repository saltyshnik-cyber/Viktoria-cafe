import type { MenuItem } from "@/types/menu";
import { sql, ensureSchema } from "@/lib/db";

const SEED_ITEMS: MenuItem[] = [
  {
    id: "shashlik-pork",
    categoryId: "shashlik",
    name: "Шашлык из свинины",
    description: "Классический шашлык из свинины, приготовленный на углях",
    weight: "200 г",
    price: 550,
  },
  {
    id: "shashlik-armenian",
    categoryId: "shashlik",
    name: "Армянский",
    description: "Свинина (2 порции), огурцы, помидоры, лаваш — набор для компании",
    weight: "400 г",
    price: 1100,
  },
  {
    id: "shashlik-lamb",
    categoryId: "shashlik",
    name: "Шашлык из баранины",
    description: "Шашлык из баранины на углях",
    weight: "190 г",
    price: 750,
  },
  {
    id: "shashlik-turkey",
    categoryId: "shashlik",
    name: "Шашлык из индейки",
    description: "Нежный шашлык из индейки на углях",
    weight: "200 г",
    price: 550,
  },
  {
    id: "shashlik-drumstick",
    categoryId: "shashlik",
    name: "Голень куриная",
    description: "Куриная голень, приготовленная на углях",
    weight: "250 г",
    price: 500,
  },
  {
    id: "shashlik-wings",
    categoryId: "shashlik",
    name: "Крылья куриные",
    description: "Куриные крылья на углях",
    weight: "250 г",
    price: 500,
  },
  {
    id: "shashlik-lyulya-beef",
    categoryId: "shashlik",
    name: "Люля-кебаб из говядины",
    description: "Рубленый шашлык из говядины на углях",
    weight: "190 г",
    price: 600,
  },
  {
    id: "shashlik-lyulya-chicken",
    categoryId: "shashlik",
    name: "Люля-кебаб из курицы",
    description: "Рубленый шашлык из курицы на углях",
    weight: "190 г",
    price: 500,
  },
  {
    id: "shashlik-entrecote-lamb",
    categoryId: "shashlik",
    name: "Антрекот из баранины",
    description: "Антрекот из баранины на кости, на углях",
    weight: "300 г",
    price: 900,
  },
  {
    id: "shashlik-entrecote-pork",
    categoryId: "shashlik",
    name: "Антрекот из свинины",
    description: "Антрекот из свинины на кости, на углях",
    weight: "300 г",
    price: 650,
  },
  {
    id: "shashlik-chicken-half",
    categoryId: "shashlik",
    name: "Курица (пол тушки)",
    description: "Половина тушки цыплёнка, приготовленная на углях",
    weight: "400 г",
    price: 600,
  },
  {
    id: "shashlik-chicken-hearts",
    categoryId: "shashlik",
    name: "Сердца куриные",
    description: "Куриные сердца на углях",
    weight: "150 г",
    price: 450,
  },
  {
    id: "shashlik-trout",
    categoryId: "shashlik",
    name: "Форель",
    description: "Форель, приготовленная на углях",
    weight: "150 г",
    price: 850,
  },
  {
    id: "shashlik-sausages",
    categoryId: "shashlik",
    name: "Колбаски домашние",
    description: "Домашние колбаски на углях",
    weight: "250 г",
    price: 550,
  },
  {
    id: "shashlik-ribs",
    categoryId: "shashlik",
    name: "Рёбра свинины",
    description: "Свиные рёбра на углях",
    weight: "250 г",
    price: 600,
  },
  {
    id: "garnish-potato-wedges",
    categoryId: "garnish",
    name: "Картофельные дольки",
    description: "Картофельные дольки, запечённые со специями",
    weight: "150 г",
    price: 250,
  },
  {
    id: "garnish-potato-tandoor",
    categoryId: "garnish",
    name: "Картофель из тандыра",
    description: "Картофель, запечённый в тандыре",
    weight: "",
    price: 150,
  },
  {
    id: "garnish-fries",
    categoryId: "garnish",
    name: "Картофель фри",
    description: "Хрустящий картофель фри",
    weight: "150 г",
    price: 200,
  },
  {
    id: "garnish-zucchini",
    categoryId: "garnish",
    name: "Цукини на углях",
    description: "Цукини, запечённые на углях",
    weight: "",
    price: 200,
  },
  {
    id: "garnish-mushrooms",
    categoryId: "garnish",
    name: "Грибы на углях",
    description: "Грибы, запечённые на углях",
    weight: "",
    price: 250,
  },
  {
    id: "garnish-eggplant",
    categoryId: "garnish",
    name: "Баклажаны на углях",
    description: "Баклажаны, запечённые на углях",
    weight: "",
    price: 200,
  },
  {
    id: "garnish-assorted-baked",
    categoryId: "garnish",
    name: "Запечённое ассорти",
    description: "Цукини, перец и помидор, запечённые на углях",
    weight: "",
    price: 350,
  },
  {
    id: "salad-caesar",
    categoryId: "salads",
    name: "Цезарь",
    description: "Классический салат Цезарь",
    weight: "300 г",
    price: 500,
  },
  {
    id: "salad-summer",
    categoryId: "salads",
    name: "Летний",
    description: "Лёгкий летний овощной салат",
    weight: "300 г",
    price: 450,
  },
  {
    id: "salad-chafan",
    categoryId: "salads",
    name: "Чафан",
    description: "Свежий овощной салат с зеленью",
    weight: "350 г",
    price: 500,
  },
  {
    id: "salad-vegetable-plate",
    categoryId: "salads",
    name: "Нарезка овощная",
    description: "Ассорти из свежих овощей",
    weight: "200 г",
    price: 250,
  },
  {
    id: "salad-cheese-herbs",
    categoryId: "salads",
    name: "Нарезка брынза-зелень",
    description: "Брынза и свежая зелень",
    weight: "150 г",
    price: 350,
  },
  {
    id: "salad-homestyle-plate",
    categoryId: "salads",
    name: "Нарезка по-домашнему",
    description: "Брынза, зелень, помидоры, огурцы",
    weight: "400 г",
    price: 600,
  },
  {
    id: "salad-shawarma-classic",
    categoryId: "salads",
    name: "Шаурма классическая",
    description: "Лаваш с мясом, овощами и фирменным соусом",
    weight: "300 г",
    price: 350,
  },
  {
    id: "drink-tea-pot",
    categoryId: "drinks",
    name: "Чайник чая",
    description: "На выбор: чёрный или зелёный чай",
    weight: "",
    price: 200,
  },
  {
    id: "drink-tea-bag",
    categoryId: "drinks",
    name: "Чай пакетированный",
    description: "Пакетированный чай",
    weight: "",
    price: 50,
  },
  {
    id: "drink-coffee-3in1",
    categoryId: "drinks",
    name: "Кофе 3в1",
    description: "Растворимый кофе 3в1",
    weight: "",
    price: 100,
  },
  {
    id: "drink-coffee-ground",
    categoryId: "drinks",
    name: "Кофе чёрный молотый",
    description: "Молотый чёрный кофе",
    weight: "",
    price: 100,
  },
  {
    id: "extra-sauce",
    categoryId: "extra",
    name: "Соус",
    description: "На выбор: барбекю, чесночный, острый или сырный",
    weight: "50 г",
    price: 50,
  },
  {
    id: "extra-lavash-armenian",
    categoryId: "extra",
    name: "Лаваш армянский",
    description: "Тонкий армянский лаваш",
    weight: "",
    price: 50,
  },
  {
    id: "extra-lavash-thick",
    categoryId: "extra",
    name: "Лаваш толстый",
    description: "Толстый лаваш",
    weight: "",
    price: 50,
  },
  {
    id: "extra-bread",
    categoryId: "extra",
    name: "Хлеб",
    description: "Хлеб к столу",
    weight: "",
    price: 5,
  },
  {
    id: "khachapuri-megrelian",
    categoryId: "khachapuri",
    name: "По-мегрельски",
    description: "С сыром внутри и сверху",
    weight: "400 г",
    price: 550,
  },
  {
    id: "khachapuri-adjarian",
    categoryId: "khachapuri",
    name: "По-аджарски",
    description: "Лодочкой, с яйцом сверху",
    weight: "400 г",
    price: 550,
  },
  {
    id: "khachapuri-imeretian",
    categoryId: "khachapuri",
    name: "По-имеретински",
    description: "Классическое хачапури с сыром внутри",
    weight: "400 г",
    price: 550,
  },
  {
    id: "khachapuri-meat-platter",
    categoryId: "khachapuri",
    name: "Мясное ассорти",
    description: "Ассорти шашлыков из мяса на большую компанию",
    weight: "7 порц",
    price: 3300,
  },
  {
    id: "khachapuri-chicken-platter",
    categoryId: "khachapuri",
    name: "Куриное ассорти",
    description: "Ассорти шашлыков из курицы на большую компанию",
    weight: "7 порц",
    price: 3300,
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
  photo_url: string;
  is_available: boolean;
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
    photoUrl: row.photo_url,
    isAvailable: row.is_available,
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
    SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY category_id, name
  `) as MenuItemRow[];
  return rows.map(rowToItem);
}

export async function getAllMenuItemsAdmin(): Promise<MenuItem[]> {
  await ready();
  const rows = (await sql`
    SELECT * FROM menu_items ORDER BY category_id, name
  `) as MenuItemRow[];
  return rows.map(rowToItem);
}

export async function getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
  await ready();
  const rows = (await sql`
    SELECT * FROM menu_items WHERE category_id = ${categoryId} AND is_available = TRUE ORDER BY name
  `) as MenuItemRow[];
  return rows.map(rowToItem);
}

export async function createMenuItem(data: Omit<MenuItem, "id">): Promise<MenuItem> {
  await ready();
  const id = crypto.randomUUID().slice(0, 8);
  await sql`
    INSERT INTO menu_items (id, category_id, name, description, weight, price, is_popular, photo_url, is_available)
    VALUES (${id}, ${data.categoryId}, ${data.name}, ${data.description}, ${data.weight}, ${data.price}, ${data.isPopular ?? false}, ${data.photoUrl ?? ""}, ${data.isAvailable ?? true})
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
        weight = ${data.weight}, price = ${data.price}, is_popular = ${data.isPopular ?? false},
        photo_url = ${data.photoUrl ?? ""}, is_available = ${data.isAvailable ?? true}
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
