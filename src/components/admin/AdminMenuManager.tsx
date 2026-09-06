"use client";

import { useState } from "react";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { uploadPhoto } from "@/lib/uploadPhoto";

type ComponentFormState = {
  name: string;
  quantity: string;
  menuItemId?: string;
};

type ItemFormState = {
  categoryId: string;
  name: string;
  description: string;
  weight: string;
  price: string;
  isPopular: boolean;
  photoUrl: string;
  isAvailable: boolean;
  sauceOptions: string[];
  composition: ComponentFormState[];
};

function emptyForm(categories: MenuCategory[]): ItemFormState {
  return {
    categoryId: categories[0]?.id ?? "",
    name: "",
    description: "",
    weight: "",
    price: "",
    isPopular: false,
    photoUrl: "",
    isAvailable: true,
    sauceOptions: [],
    composition: [],
  };
}

function itemToForm(item: MenuItem): ItemFormState {
  return {
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    weight: item.weight,
    price: item.price != null ? String(item.price) : "",
    isPopular: Boolean(item.isPopular),
    photoUrl: item.photoUrl ?? "",
    isAvailable: item.isAvailable ?? true,
    sauceOptions: item.sauceOptions ?? [],
    composition: (item.composition ?? []).map((c) => ({
      name: c.name,
      quantity: String(c.quantity),
      menuItemId: c.menuItemId,
    })),
  };
}

function PhotoPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 sm:col-span-2">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-cream text-2xl">
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          "🍽️"
        )}
      </div>
      <div>
        <label className="inline-block cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-sm text-ink/70 hover:border-primary hover:text-primary">
          {uploading ? "Загрузка…" : value ? "Заменить фото" : "Загрузить фото"}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

function ItemForm({
  categories,
  menuItems,
  excludeId,
  value,
  onChange,
}: {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  excludeId?: string;
  value: ItemFormState;
  onChange: (next: ItemFormState) => void;
}) {
  const pickableItems = menuItems.filter(
    (item) => item.id !== excludeId && (item.composition?.length ?? 0) === 0,
  );

  function updateComponent(index: number, next: ComponentFormState) {
    const composition = [...value.composition];
    composition[index] = next;
    onChange({ ...value, composition });
  }

  function removeComponent(index: number) {
    onChange({
      ...value,
      composition: value.composition.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PhotoPicker
        value={value.photoUrl}
        onChange={(photoUrl) => onChange({ ...value, photoUrl })}
      />
      <input
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Название *"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      <select
        value={value.categoryId}
        onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.emoji} {category.name}
          </option>
        ))}
      </select>
      <input
        value={value.description}
        onChange={(e) => onChange({ ...value, description: e.target.value })}
        placeholder="Описание"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary sm:col-span-2"
      />
      <input
        value={value.weight}
        onChange={(e) => onChange({ ...value, weight: e.target.value })}
        placeholder="Вес/объём, напр. 300 г"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      <input
        value={value.price}
        onChange={(e) => onChange({ ...value, price: e.target.value })}
        type="number"
        min="0"
        placeholder="Цена, ₽ (можно дозаполнить позже)"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={value.isPopular}
          onChange={(e) => onChange({ ...value, isPopular: e.target.checked })}
        />
        Хит меню
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={!value.isAvailable}
          onChange={(e) => onChange({ ...value, isAvailable: !e.target.checked })}
        />
        Скрыть (временно закончилось)
      </label>

      <div className="sm:col-span-2">
        <span className="mb-1 block text-sm font-medium text-ink/70">
          Варианты соуса (необязательно)
        </span>
        <div className="space-y-2">
          {value.sauceOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={option}
                onChange={(e) => {
                  const next = [...value.sauceOptions];
                  next[index] = e.target.value;
                  onChange({ ...value, sauceOptions: next });
                }}
                placeholder="Например: Чесночный"
                className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    sauceOptions: value.sauceOptions.filter((_, i) => i !== index),
                  })
                }
                aria-label="Удалить вариант соуса"
                className="text-sm text-ink/40 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, sauceOptions: [...value.sauceOptions, ""] })
            }
            className="text-sm font-medium text-primary hover:underline"
          >
            + добавить вариант
          </button>
        </div>
      </div>

      <div className="sm:col-span-2">
        <span className="mb-1 block text-sm font-medium text-ink/70">
          Состав комбо (необязательно — заполните, если это набор из нескольких позиций)
        </span>
        <div className="space-y-2">
          {value.composition.map((component, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={component.name}
                onChange={(e) => updateComponent(index, { ...component, name: e.target.value })}
                placeholder="Название позиции"
                className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <input
                value={component.quantity}
                onChange={(e) => updateComponent(index, { ...component, quantity: e.target.value })}
                type="number"
                min="1"
                placeholder="Кол-во"
                className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => removeComponent(index)}
                aria-label="Удалить позицию из состава"
                className="text-sm text-ink/40 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                const selected = pickableItems.find((item) => item.id === e.target.value);
                if (!selected) return;
                onChange({
                  ...value,
                  composition: [
                    ...value.composition,
                    { name: selected.name, quantity: "1", menuItemId: selected.id },
                  ],
                });
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            >
              <option value="">Добавить блюдо из меню…</option>
              {pickableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  composition: [...value.composition, { name: "", quantity: "1" }],
                })
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              + добавить текстом
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMenuManager({
  categories,
  initialItems,
}: {
  categories: MenuCategory[];
  initialItems: MenuItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState<ItemFormState>(emptyForm(categories));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemFormState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function toPayload(form: ItemFormState) {
    return {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim(),
      weight: form.weight.trim(),
      price: form.price.trim() ? Number(form.price) : undefined,
      isPopular: form.isPopular,
      photoUrl: form.photoUrl,
      isAvailable: form.isAvailable,
      sauceOptions: form.sauceOptions.map((s) => s.trim()).filter((s) => s.length > 0),
      composition: form.composition
        .map((c) => ({
          name: c.name.trim(),
          quantity: Math.max(1, Math.floor(Number(c.quantity) || 1)),
          menuItemId: c.menuItemId,
        }))
        .filter((c) => c.name.length > 0),
    };
  }

  async function handleCreate() {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(newItem)),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось добавить блюдо");
        return;
      }

      setItems((current) => [...current, data.item]);
      setNewItem(emptyForm(categories));
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditForm(itemToForm(item));
    setError(null);
  }

  async function handleUpdate(id: string) {
    if (!editForm) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить изменения");
        return;
      }

      setItems((current) =>
        current.map((item) => (item.id === id ? data.item : item)),
      );
      setEditingId(null);
      setEditForm(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsSaving(true);
    try {
      await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
      setDeletingId(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <div className="rounded-xl2 border border-black/10 bg-white p-4">
        <h2 className="font-semibold text-ink">Добавить блюдо</h2>
        <div className="mt-3">
          <ItemForm
            categories={categories}
            menuItems={items}
            value={newItem}
            onChange={setNewItem}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSaving || !newItem.name.trim() || !newItem.categoryId}
          className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Добавить
        </button>
      </div>

      {categories.map((category) => {
        const categoryItems = items.filter(
          (item) => item.categoryId === category.id,
        );
        if (categoryItems.length === 0) return null;

        return (
          <div key={category.id}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-ink">
              <span>{category.emoji}</span>
              {category.name}
            </h2>

            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl2 border border-black/10 bg-white p-4"
                >
                  {editingId === item.id && editForm ? (
                    <div>
                      <ItemForm
                        categories={categories}
                        menuItems={items}
                        excludeId={item.id}
                        value={editForm}
                        onChange={setEditForm}
                      />
                      {error && (
                        <p className="mt-3 text-sm text-red-600">{error}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate(item.id)}
                          disabled={isSaving}
                          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-cream hover:bg-primary-dark disabled:opacity-40"
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                            setError(null);
                          }}
                          className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-ink/60 hover:text-primary"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream text-2xl">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "🍽️"
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                            {item.name}
                            {item.isPopular && (
                              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                Хит
                              </span>
                            )}
                            {item.isAvailable === false && (
                              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-medium text-ink/60">
                                Скрыто
                              </span>
                            )}
                            {item.isAvailable !== false && item.price == null && (
                              <span
                                className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                                title="Без цены блюдо нельзя добавить в корзину, поэтому оно не показывается на сайте, пока цена не заполнена"
                              >
                                Черновик — не видно гостям, нет цены
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-sm text-ink/60">
                            {item.description}
                          </div>
                          <div className="mt-1 text-sm text-ink/50">
                            {[item.weight, item.price != null ? `${item.price} ₽` : "цена не указана"]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                          {item.sauceOptions && item.sauceOptions.length > 0 && (
                            <div className="mt-1 text-sm text-ink/50">
                              Соусы: {item.sauceOptions.join(", ")}
                            </div>
                          )}
                          {item.composition && item.composition.length > 0 && (
                            <div className="mt-1 text-sm text-ink/50">
                              Состав:{" "}
                              {item.composition
                                .map((c) => (c.quantity > 1 ? `${c.name} × ${c.quantity}` : c.name))
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>

                      {deletingId === item.id ? (
                        <div className="flex shrink-0 items-center gap-2 text-sm">
                          <span className="text-ink/60">Удалить?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={isSaving}
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
                        </div>
                      ) : (
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-sm text-ink/50 hover:text-primary"
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            className="text-sm text-ink/50 hover:text-primary"
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
