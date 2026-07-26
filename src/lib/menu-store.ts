import fs from "fs";
import path from "path";
import type { MenuItem } from "@/types/menu";

// Файловое хранилище для локальной разработки, аналогично src/lib/orders.ts.
// На проде нужна настоящая БД — это временное решение для одного сервера.
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "menu.json");

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

function readAll(): MenuItem[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    // Файла ещё нет (первый запуск) или диск недоступен для записи (serverless) —
    // в обоих случаях просто отдаём исходные данные, не пытаясь ничего записать.
    return SEED_ITEMS;
  }
}

function writeAll(items: MenuItem[]) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
  } catch (error) {
    throw new Error(
      "Не удалось сохранить меню: файловое хранилище недоступно на этом хостинге (нужна БД для serverless-окружений).",
      { cause: error },
    );
  }
}

export function getAllMenuItems(): MenuItem[] {
  return readAll();
}

export function getMenuItemsByCategory(categoryId: string): MenuItem[] {
  return readAll().filter((item) => item.categoryId === categoryId);
}

export function createMenuItem(data: Omit<MenuItem, "id">): MenuItem {
  const items = readAll();
  const item: MenuItem = { ...data, id: crypto.randomUUID().slice(0, 8) };
  items.push(item);
  writeAll(items);
  return item;
}

export function updateMenuItem(
  id: string,
  data: Omit<MenuItem, "id">,
): MenuItem | undefined {
  const items = readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...data, id };
  writeAll(items);
  return items[index];
}

export function deleteMenuItem(id: string): boolean {
  const items = readAll();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  writeAll(next);
  return true;
}
