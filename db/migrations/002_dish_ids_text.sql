-- Id блюд и категорий в проекте — строки (см. MenuItem.id в menu-store).
-- Переводим колонки связей из bigint в text. Идемпотентно: повторный
-- запуск на уже изменённой колонке ничего не ломает.

alter table promotion_dishes
  alter column dish_id type text using dish_id::text;

alter table promotion_categories
  alter column category_id type text using category_id::text;