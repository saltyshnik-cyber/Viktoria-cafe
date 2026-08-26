"use client";

import { useState } from "react";
import type { Review } from "@/lib/reviews";

type ReviewFormState = {
  name: string;
  dateLabel: string;
  rating: number;
  text: string;
  checkAmount: string;
};

function emptyForm(): ReviewFormState {
  return { name: "", dateLabel: "", rating: 5, text: "", checkAmount: "" };
}

function reviewToForm(review: Review): ReviewFormState {
  return {
    name: review.name,
    dateLabel: review.dateLabel,
    rating: review.rating,
    text: review.text,
    checkAmount: review.checkAmount ?? "",
  };
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1 text-xl text-accent">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} звёзд`}
          className={star <= value ? "opacity-100" : "opacity-25"}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  value,
  onChange,
}: {
  value: ReviewFormState;
  onChange: (next: ReviewFormState) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="Имя гостя"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      <input
        value={value.dateLabel}
        onChange={(e) => onChange({ ...value, dateLabel: e.target.value })}
        placeholder="Дата/подпись, напр. «23 июля 2026 · 9 отзывов»"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
      />
      <div className="flex items-center gap-3 sm:col-span-2">
        <span className="text-sm text-ink/70">Рейтинг:</span>
        <StarPicker value={value.rating} onChange={(rating) => onChange({ ...value, rating })} />
      </div>
      <textarea
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder="Текст отзыва"
        rows={3}
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary sm:col-span-2"
      />
      <input
        value={value.checkAmount}
        onChange={(e) => onChange({ ...value, checkAmount: e.target.value })}
        placeholder="Чек, напр. «500–1000 ₽» (необязательно)"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary sm:col-span-2"
      />
    </div>
  );
}

export default function ReviewsManager({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState<ReviewFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ReviewFormState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function toPayload(form: ReviewFormState) {
    return {
      name: form.name.trim(),
      dateLabel: form.dateLabel.trim(),
      rating: form.rating,
      text: form.text.trim(),
      checkAmount: form.checkAmount.trim() || null,
    };
  }

  async function handleCreate() {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(newReview)),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось добавить отзыв");
        return;
      }
      setReviews((current) => [data.review, ...current]);
      setNewReview(emptyForm());
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(review: Review) {
    setEditingId(review.id);
    setEditForm(reviewToForm(review));
    setError(null);
  }

  async function handleUpdate(id: string) {
    if (!editForm) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(editForm)),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось сохранить изменения");
        return;
      }
      setReviews((current) => current.map((r) => (r.id === id ? data.review : r)));
      setEditingId(null);
      setEditForm(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsSaving(true);
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      setReviews((current) => current.filter((r) => r.id !== id));
      setDeletingId(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-xl2 border border-black/10 bg-white p-4">
      <h2 className="font-semibold text-ink">Отзывы гостей</h2>

      <div className="mt-3 rounded-xl border border-dashed border-black/20 p-3">
        <h3 className="text-sm font-semibold text-ink/70">Добавить отзыв</h3>
        <div className="mt-2">
          <ReviewForm value={newReview} onChange={setNewReview} />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSaving || !newReview.name.trim() || !newReview.text.trim()}
          className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Добавить
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-black/10 p-3">
            {editingId === review.id && editForm ? (
              <div>
                <ReviewForm value={editForm} onChange={setEditForm} />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(review.id)}
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
                  <div className="font-semibold text-ink">{review.name}</div>
                  <div className="text-xs text-ink/50">{review.dateLabel}</div>
                  <div className="mt-1 text-accent">{"★".repeat(review.rating)}</div>
                  <p className="mt-1 text-sm text-ink/70">{review.text}</p>
                  {review.checkAmount && (
                    <p className="mt-1 text-xs text-ink/50">Чек: {review.checkAmount}</p>
                  )}
                </div>

                {deletingId === review.id ? (
                  <div className="flex shrink-0 items-center gap-2 text-sm">
                    <span className="text-ink/60">Удалить?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
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
                  <div className="flex shrink-0 gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => startEdit(review)}
                      className="text-ink/50 hover:text-primary"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(review.id)}
                      className="text-ink/50 hover:text-primary"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="text-sm text-ink/60">Отзывов пока нет.</p>
        )}
      </div>
    </section>
  );
}
