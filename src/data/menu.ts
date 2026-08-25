import type { MenuCategory } from "@/types/menu";
import { getMenuItemsByCategory } from "@/lib/menu-store";

export const categories: MenuCategory[] = [
  { id: "shashlik", name: "Шашлыки", emoji: "🍢" },
  { id: "garnish", name: "Гарниры", emoji: "🥔" },
  { id: "salads", name: "Салаты и закуски", emoji: "🥗" },
  { id: "drinks", name: "Напитки", emoji: "🥤" },
  { id: "extra", name: "Дополнительно", emoji: "🫔" },
  { id: "khachapuri", name: "Хачапури", emoji: "🫓" },
];

export const getItemsByCategory = getMenuItemsByCategory;
