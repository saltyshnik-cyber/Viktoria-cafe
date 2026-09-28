import type { ComboComponent } from "@/types/menu";

// Сколько позиций состава показываем в свёрнутом превью на карточке —
// остальное раскрывается по стрелке "Состав" (полный список — там же и в
// модалке).
export const MAX_PREVIEW_COMPONENTS = 3;

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
