"use client";

import { useEffect, useMemo, useState } from "react";
import type { PromotionKind, PromotionScope } from "@/types/promotions";

type SerializedPromotion = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  kind: PromotionKind;
  value: number;
  maxDiscount: number | null;
  minOrderTotal: number;
  scope: PromotionScope;
  dishIds: string[];
  categoryIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  weekdays: number[] | null;
  timeFrom: string | null;
  timeTo: string | null;
  priority: number;
  stackable: boolean;
  isEnabled: boolean;
};

type DishOption = { id: string; name: string; categoryId: string };
type CategoryOption = { id: string; name: string; emoji: string };
type Filter = "all" | "active" | "scheduled" | "expired" | "disabled";

const KIND_LABELS: Record<PromotionKind, string> = {
  percent_dish: "Процент на блюдо",
  fixed_dish: "Фиксированная сумма с блюда",
  percent_category: "Процент на категорию",
  promo_code: "Промокод",
  second_gift: "Второе в подарок",
  free_delivery: "Бесплатная доставка",
  order_total: "Скидка от суммы заказа",
};

const PERCENT_KINDS: PromotionKind[] = ["percent_dish", "percent_category", "order_total"];
const WEEKDAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

function statusOf(promotion: SerializedPromotion, now: number): Exclude<Filter, "all"> {
  if (!promotion.isEnabled) return "disabled";
  if (promotion.startsAt && new Date(promotion.startsAt).getTime() > now) return "scheduled";
  if (promotion.endsAt && new Date(promotion.endsAt).getTime() <= now) return "expired";
  return "active";
}

function formatValue(promotion: SerializedPromotion): string {
  if (promotion.kind === "free_delivery") return "бесплатная доставка";
  if (promotion.kind === "second_gift") return "второе в подарок";
  return PERCENT_KINDS.includes(promotion.kind)
    ? `${promotion.value}%`
    : `${promotion.value} ₽`;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Ответы админских API могут быть массивом или объектом с массивом внутри. */
function pickArray(data: unknown, key: string): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const value = (data as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function readDishes(data: unknown): DishOption[] {
  return pickArray(data, "items").map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      categoryId: String(item.categoryId ?? item.category_id ?? ""),
    };
  });
}

function readCategories(data: unknown): CategoryOption[] {
  return pickArray(data, "categories").map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      emoji: String(item.emoji ?? ""),
    };
  });
}

type FormState = {
  id: number | null;
  title: string;
  description: string;
  kind: PromotionKind;
  value: string;
  maxDiscount: string;
  minOrderTotal: string;
  scope: PromotionScope;
  dishIds: string[];
  categoryIds: string[];
  startsAt: string;
  endsAt: string;
  weekdays: number[];
  timeFrom: string;
  timeTo: string;
  priority: string;
  stackable: boolean;
  isEnabled: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  description: "",
  kind: "percent_dish",
  value: "20",
  maxDiscount: "",
  minOrderTotal: "",
  scope: "all",
  dishIds: [],
  categoryIds: [],
  startsAt: "",
  endsAt: "",
  weekdays: [],
  timeFrom: "",
  timeTo: "",
  priority: "0",
  stackable: false,
  isEnabled: true,
};

function formFrom(promotion: SerializedPromotion): FormState {
  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description ?? "",
    kind: promotion.kind,
    value: String(promotion.value),
    maxDiscount: promotion.maxDiscount === null ? "" : String(promotion.maxDiscount),
    minOrderTotal: promotion.minOrderTotal ? String(promotion.minOrderTotal) : "",
    scope: promotion.scope,
    dishIds: promotion.dishIds,
    categoryIds: promotion.categoryIds,
    startsAt: toLocalInput(promotion.startsAt),
    endsAt: toLocalInput(promotion.endsAt),
    weekdays: promotion.weekdays ?? [],
    timeFrom: promotion.timeFrom ?? "",
    timeTo: promotion.timeTo ?? "",
    priority: String(promotion.priority),
    stackable: promotion.stackable,
    isEnabled: promotion.isEnabled,
  };
}

export default function PromotionsManager({
  initialPromotions,
}: {
  initialPromotions: SerializedPromotion[];
}) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [dishes, setDishes] = useState<DishOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [referenceLoaded, setReferenceLoaded] = useState(false);
  const [dishQuery, setDishQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = Date.now();

  // Блюда и категории нужны только когда в форме выбирают область действия,
  // поэтому грузим их один раз при первом открытии формы.
  useEffect(() => {
    if (form === null || referenceLoaded) return;

    let cancelled = false;
    void (async () => {
      try {
        const [menuResponse, categoriesResponse] = await Promise.all([
          fetch("/api/admin/menu"),
          fetch("/api/admin/categories"),
        ]);
        const menuData = menuResponse.ok ? await menuResponse.json() : null;
        const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : null;
        if (cancelled) return;
        setDishes(readDishes(menuData));
        setCategories(readCategories(categoriesData));
      } catch {
        // Без справочников можно сохранить акцию на всё меню — форма не блокируется.
      } finally {
        if (!cancelled) setReferenceLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form, referenceLoaded]);

  const filterCounts = useMemo(() => {
    const counts: Record<Filter, number> = {
      all: promotions.length,
      active: 0,
      scheduled: 0,
      expired: 0,
      disabled: 0,
    };
    for (const promotion of promotions) counts[statusOf(promotion, now)] += 1;
    return counts;
  }, [promotions, now]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return promotions.filter((promotion) => {
      if (filter !== "all" && statusOf(promotion, now) !== filter) return false;
      if (!query) return true;
      return promotion.title.toLowerCase().includes(query);
    });
  }, [promotions, filter, search, now]);

  const dishOptions = useMemo(() => {
    const query = dishQuery.trim().toLowerCase();
    const list = query
      ? dishes.filter((dish) => dish.name.toLowerCase().includes(query))
      : dishes;
    return list.slice(0, 60);
  }, [dishes, dishQuery]);

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function openCreate() {
    setError(null);
    setDishQuery("");
    setForm({ ...EMPTY_FORM });
  }

  function openEdit(promotion: SerializedPromotion) {
    setError(null);
    setDishQuery("");
    setForm(formFrom(promotion));
  }

  function changeKind(kind: PromotionKind) {
    const scope: PromotionScope =
      kind === "percent_category"
        ? "categories"
        : kind === "percent_dish" || kind === "fixed_dish"
          ? form?.scope === "dishes"
            ? "dishes"
            : "all"
          : "all";
    patchForm({ kind, scope });
  }

  function toggleInList(key: "dishIds" | "categoryIds", id: string) {
    if (!form) return;
    const current = form[key];
    patchForm({
      [key]: current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    } as Partial<FormState>);
  }

  function toggleWeekday(day: number) {
    if (!form) return;
    patchForm({
      weekdays: form.weekdays.includes(day)
        ? form.weekdays.filter((item) => item !== day)
        : [...form.weekdays, day].sort((a, b) => a - b),
    });
  }

  async function handleToggle(promotion: SerializedPromotion) {
    setError(null);
    setBusyId(promotion.id);
    try {
      const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !promotion.isEnabled }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось переключить акцию");
        return;
      }
      setPromotions((prev) =>
        prev.map((item) => (item.id === promotion.id ? data.promotion : item)),
      );
    } catch {
      setError("Не удалось переключить акцию. Проверьте соединение.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось удалить акцию");
        return;
      }
      setPromotions((prev) => prev.filter((item) => item.id !== id));
      setDeletingId(null);
      if (form?.id === id) setForm(null);
    } catch {
      setError("Не удалось удалить акцию. Проверьте соединение.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      kind: form.kind,
      value: Number(form.value),
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      minOrderTotal: form.minOrderTotal === "" ? 0 : Number(form.minOrderTotal),
      scope: form.scope,
      dishIds: form.scope === "dishes" ? form.dishIds : [],
      categoryIds: form.scope === "categories" ? form.categoryIds : [],
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt),
      weekdays: form.weekdays,
      timeFrom: form.timeFrom || null,
      timeTo: form.timeTo || null,
      priority: Number(form.priority) || 0,
      stackable: form.stackable,
      isEnabled: form.isEnabled,
    };

    try {
      const response = await fetch(
        form.id === null ? "/api/admin/promotions" : `/api/admin/promotions/${form.id}`,
        {
          method: form.id === null ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить акцию");
        return;
      }

      setPromotions((prev) =>
        form.id === null
          ? [data.promotion, ...prev]
          : prev.map((item) => (item.id === form.id ? data.promotion : item)),
      );
      setForm(null);
    } catch {
      setError("Не удалось сохранить акцию. Проверьте соединение.");
    } finally {
      setSaving(false);
    }
  }

  const showDishScope = form?.kind === "percent_dish" || form?.kind === "fixed_dish";
  const showCategoryScope =
    form?.kind === "percent_category" || (showDishScope && form?.scope === "categories");

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "active", "scheduled", "expired", "disabled"] as Filter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === value
                ? "bg-primary text-cream"
                : "border border-black/10 text-ink/60 hover:text-primary"
            }`}
          >
            {value === "all"
              ? "Все"
              : value === "active"
                ? "Действуют"
                : value === "scheduled"
                  ? "Запланированы"
                  : value === "expired"
                    ? "Завершены"
                    : "Выключены"}{" "}
            ({filterCounts[value]})
          </button>
        ))}
        <button
          type="button"
          onClick={openCreate}
          className="ml-auto rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-black"
        >
          + Новая акция
        </button>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Поиск по названию"
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-ink outline-none focus:border-primary"
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-3">
        {visible.map((promotion) => {
          const status = statusOf(promotion, now);
          const scopeText =
            promotion.scope === "all"
              ? "всё меню"
              : promotion.scope === "dishes"
                ? `блюда: ${promotion.dishIds.length}`
                : `категории: ${promotion.categoryIds.length}`;

          return (
            <div key={promotion.id} className="rounded-xl2 border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{promotion.title}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {formatValue(promotion)}
                    </span>
                    <span className="text-xs text-ink/50">{KIND_LABELS[promotion.kind]}</span>
                    {status !== "active" && (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-ink/60">
                        {status === "disabled"
                          ? "выключена"
                          : status === "scheduled"
                            ? "запланирована"
                            : "завершена"}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-ink/50">
                    {scopeText}
                    {promotion.minOrderTotal > 0 && ` · от ${promotion.minOrderTotal} ₽`}
                    {promotion.endsAt &&
                      ` · до ${new Date(promotion.endsAt).toLocaleDateString("ru-RU")}`}
                    {promotion.timeFrom &&
                      promotion.timeTo &&
                      ` · ${promotion.timeFrom}–${promotion.timeTo}`}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => handleToggle(promotion)}
                    disabled={busyId === promotion.id}
                    aria-pressed={promotion.isEnabled}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                      promotion.isEnabled
                        ? "bg-primary text-cream"
                        : "border border-black/15 text-ink/50"
                    }`}
                  >
                    {promotion.isEnabled ? "Включена" : "Выключена"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(promotion)}
                    className="text-ink/50 hover:text-primary"
                  >
                    Изменить
                  </button>
                  {deletingId === promotion.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-ink/60">Удалить?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(promotion.id)}
                        disabled={busyId === promotion.id}
                        className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-40"
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="text-ink/50 hover:text-primary"
                      >
                        Нет
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(promotion.id)}
                      className="text-ink/50 hover:text-primary"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-sm text-ink/60">Акций с такими условиями нет.</p>
        )}
      </div>

      {form && (
        <div className="rounded-xl2 border border-primary/30 bg-white p-4">
          <h2 className="font-semibold text-ink">
            {form.id === null ? "Новая акция" : "Редактирование акции"}
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink/70 sm:col-span-2">
              Название
              <input
                value={form.title}
                onChange={(event) => patchForm({ title: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                placeholder="Обеденная скидка −20%"
              />
            </label>

            <label className="text-sm text-ink/70 sm:col-span-2">
              Описание
              <textarea
                value={form.description}
                onChange={(event) => patchForm({ description: event.target.value })}
                rows={2}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm text-ink/70">
              Тип акции
              <select
                value={form.kind}
                onChange={(event) => changeKind(event.target.value as PromotionKind)}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              >
                {(Object.keys(KIND_LABELS) as PromotionKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-ink/70">
              Размер скидки {PERCENT_KINDS.includes(form.kind) ? "(%)" : "(₽)"}
              <input
                type="number"
                min={1}
                max={PERCENT_KINDS.includes(form.kind) ? 100 : undefined}
                value={form.value}
                onChange={(event) => patchForm({ value: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm text-ink/70">
              Максимальная скидка, ₽
              <input
                type="number"
                min={0}
                value={form.maxDiscount}
                onChange={(event) => patchForm({ maxDiscount: event.target.value })}
                placeholder="без ограничения"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm text-ink/70">
              Минимальная сумма заказа, ₽
              <input
                type="number"
                min={0}
                value={form.minOrderTotal}
                onChange={(event) => patchForm({ minOrderTotal: event.target.value })}
                placeholder="0"
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            {(showDishScope || form.kind === "percent_category") && (
              <label className="text-sm text-ink/70 sm:col-span-2">
                На что распространяется
                <select
                  value={form.scope}
                  onChange={(event) => patchForm({ scope: event.target.value as PromotionScope })}
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                >
                  {showDishScope && <option value="all">Всё меню</option>}
                  {showDishScope && <option value="dishes">Конкретные блюда</option>}
                  <option value="categories">Категории</option>
                </select>
              </label>
            )}

            {form.scope === "dishes" && (
              <div className="sm:col-span-2">
                <div className="text-sm text-ink/70">Блюда (выбрано: {form.dishIds.length})</div>
                <input
                  value={dishQuery}
                  onChange={(event) => setDishQuery(event.target.value)}
                  placeholder="Поиск блюда"
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-black/10 p-2">
                  {dishOptions.map((dish) => (
                    <label
                      key={dish.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-ink/80 hover:bg-black/5"
                    >
                      <input
                        type="checkbox"
                        checked={form.dishIds.includes(dish.id)}
                        onChange={() => toggleInList("dishIds", dish.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      {dish.name}
                    </label>
                  ))}
                  {dishOptions.length === 0 && (
                    <p className="px-2 py-1 text-sm text-ink/50">Ничего не найдено.</p>
                  )}
                </div>
              </div>
            )}

            {form.scope === "categories" && (
              <div className="sm:col-span-2">
                <div className="text-sm text-ink/70">
                  Категории (выбрано: {form.categoryIds.length})
                </div>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-black/10 p-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-ink/80 hover:bg-black/5"
                    >
                      <input
                        type="checkbox"
                        checked={form.categoryIds.includes(category.id)}
                        onChange={() => toggleInList("categoryIds", category.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      {category.emoji} {category.name}
                    </label>
                  ))}
                  {categories.length === 0 && (
                    <p className="px-2 py-1 text-sm text-ink/50">Категории не загрузились.</p>
                  )}
                </div>
              </div>
            )}

            <label className="text-sm text-ink/70">
              Действует с
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => patchForm({ startsAt: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm text-ink/70">
              Действует до
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => patchForm({ endsAt: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <span className="mt-1 block text-xs text-ink/40">Пусто — бессрочно</span>
            </label>

            <label className="text-sm text-ink/70">
              Время с
              <input
                type="time"
                value={form.timeFrom}
                onChange={(event) => patchForm({ timeFrom: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm text-ink/70">
              Время до
              <input
                type="time"
                value={form.timeTo}
                onChange={(event) => patchForm({ timeTo: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <div className="sm:col-span-2">
              <div className="text-sm text-ink/70">Дни недели</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, index) => {
                  const day = index + 1;
                  const selected = form.weekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      aria-pressed={selected}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        selected
                          ? "bg-primary text-cream"
                          : "border border-black/10 text-ink/60 hover:text-primary"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <span className="mt-1 block text-xs text-ink/40">
                Ничего не выбрано — каждый день
              </span>
            </div>

            <label className="text-sm text-ink/70">
              Приоритет
              <input
                type="number"
                value={form.priority}
                onChange={(event) => patchForm({ priority: event.target.value })}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
            </label>

            <div className="flex flex-col gap-2 pt-6 text-sm text-ink/70">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.stackable}
                  onChange={(event) => patchForm({ stackable: event.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Складывается с другими акциями
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(event) => patchForm({ isEnabled: event.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                Акция включена
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:opacity-40"
            >
              {saving ? "Сохраняем…" : form.id === null ? "Создать акцию" : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(null);
                setError(null);
              }}
              className="text-sm text-ink/50 hover:text-primary"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}