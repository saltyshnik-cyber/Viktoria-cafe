"use client";

import { useState } from "react";
import type { MenuCategory, MenuItem } from "@/types/menu";

type ItemFormState = {
  categoryId: string;
  name: string;
  description: string;
  weight: string;
  price: string;
  isPopular: boolean;
};

function emptyForm(categories: MenuCategory[]): ItemFormState {
  return {
    categoryId: categories[0]?.id ?? "",
    name: "",
    description: "",
    weight: "",
    price: "",
    isPopular: false,
  };
}

function itemToForm(item: MenuItem): ItemFormState {
  return {
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    weight: item.weight,
    price: String(item.price),
    isPopular: Boolean(item.isPopular),
  };
}

function ItemForm({
  categories,
  value,
  onChange,
}: {
  categories: MenuCategory[];
  value: ItemFormState;
  onChange: (next: ItemFormState) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Название"
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
        placeholder="Цена, ₽"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      <label className="flex items-center gap-2 text-sm text-ink/70 sm:col-span-2">
        <input
          type="checkbox"
          checked={value.isPopular}
          onChange={(e) => onChange({ ...value, isPopular: e.target.checked })}
        />
        Хит меню
      </label>
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
      price: Number(form.price),
      isPopular: form.isPopular,
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
          <ItemForm categories={categories} value={newItem} onChange={setNewItem} />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSaving || !newItem.name.trim() || !newItem.price}
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
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-ink">
                          {item.name}
                          {item.isPopular && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              Хит
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm text-ink/60">
                          {item.description}
                        </div>
                        <div className="mt-1 text-sm text-ink/50">
                          {item.weight} · {item.price} ₽
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
