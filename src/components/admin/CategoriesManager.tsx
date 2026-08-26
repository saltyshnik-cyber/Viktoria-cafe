"use client";

import { useState } from "react";
import type { MenuCategory } from "@/types/menu";

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: MenuCategory[];
}) {
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) {
      setError("Введите название категории");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, emoji: newEmoji }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось создать категорию");
        return;
      }
      setCategories((prev) => [...prev, json.category]);
      setNewName("");
      setNewEmoji("");
    } catch {
      setError("Не удалось создать категорию. Проверьте соединение.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c: MenuCategory) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmoji(c.emoji);
    setError(null);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      setError("Введите название категории");
      return;
    }
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, emoji: editEmoji }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось сохранить категорию");
        return;
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? json.category : c)));
      setEditingId(null);
    } catch {
      setError("Не удалось сохранить категорию. Проверьте соединение.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Не удалось изменить порядок");
        return;
      }
      setCategories((prev) => {
        const index = prev.findIndex((c) => c.id === id);
        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (index === -1 || swapIndex < 0 || swapIndex >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
        return next;
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось удалить категорию");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
    } catch {
      setError("Не удалось удалить категорию. Проверьте соединение.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-3">
        {categories.map((c, i) => (
          <div key={c.id} className="rounded-xl2 border border-black/10 bg-white p-4">
            {editingId === c.id ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={editEmoji}
                  onChange={(e) => setEditEmoji(e.target.value)}
                  placeholder="Эмодзи"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary sm:w-20"
                />
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Название"
                  className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(c.id)}
                    disabled={busyId === c.id}
                    className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-cream hover:bg-primary-dark disabled:opacity-40"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-ink/60 hover:text-primary"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <span>{c.emoji}</span>
                  {c.name}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex flex-col leading-none">
                    <button
                      type="button"
                      onClick={() => handleMove(c.id, "up")}
                      disabled={busyId === c.id || i === 0}
                      className="text-ink/40 hover:text-primary disabled:opacity-30"
                      aria-label="Выше"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(c.id, "down")}
                      disabled={busyId === c.id || i === categories.length - 1}
                      className="text-ink/40 hover:text-primary disabled:opacity-30"
                      aria-label="Ниже"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    disabled={busyId === c.id}
                    className="text-ink/50 hover:text-primary disabled:opacity-40"
                  >
                    Изменить
                  </button>
                  {deletingId === c.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-ink/60">Удалить?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={busyId === c.id}
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
                      onClick={() => setDeletingId(c.id)}
                      disabled={busyId === c.id}
                      className="text-ink/50 hover:text-primary disabled:opacity-40"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-sm text-ink/60">Категорий пока нет.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl2 border border-dashed border-black/20 p-4">
        <h2 className="font-semibold text-ink">Добавить категорию</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="Эмодзи (необязательно)"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary sm:w-40"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Название"
            className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? "Добавление…" : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}
