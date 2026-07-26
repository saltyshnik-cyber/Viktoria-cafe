import type { MenuCategory } from "@/types/menu";
import { getMenuItemsByCategory } from "@/lib/menu-store";

export const categories: MenuCategory[] = [
  { id: "soups", name: "Супы", emoji: "🍲" },
  { id: "salads", name: "Салаты", emoji: "🥗" },
  { id: "hot", name: "Горячие блюда", emoji: "🍽️" },
  { id: "pizza", name: "Пицца", emoji: "🍕" },
  { id: "burgers", name: "Бургеры", emoji: "🍔" },
  { id: "drinks", name: "Напитки", emoji: "🥤" },
  { id: "desserts", name: "Десерты", emoji: "🍰" },
];

export const getItemsByCategory = getMenuItemsByCategory;
