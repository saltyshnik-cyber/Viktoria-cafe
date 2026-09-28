import type { ComboComponent } from "@/types/menu";

// Сколько позиций состава показываем на карточке в списке — остальное
// сворачивается в строку "+ ещё N позиций" (полный список — в модалке).
export const MAX_VISIBLE_COMPONENTS = 4;

export function pluralizePositions(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "позиций";
  if (mod10 === 1) return "позиция";
  if (mod10 >= 2 && mod10 <= 4) return "позиции";
  return "позиций";
}

/**
 * Грубая эвристика: описание просто пересказывает состав (например,
 * "Фри 1 порция, наггетсы 4 шт" при составе из тех же позиций). Данные в
 * базе не меняем — просто не показываем такое описание на карточке в
 * списке (в модалке оно по-прежнему показывается полностью).
 */
export function descriptionDuplicatesComposition(
  description: string | undefined,
  composition: ComboComponent[] | undefined,
): boolean {
  if (!description || !description.trim() || !composition || composition.length === 0) {
    return false;
  }
  const normalizedDescription = description.toLowerCase();
  return composition.some(
    (component) =>
      component.name.length >= 3 && normalizedDescription.includes(component.name.toLowerCase()),
  );
}
