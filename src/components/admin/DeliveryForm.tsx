"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/siteSettings";

type FormState = Pick<SiteSettings, "deliveryThreshold" | "deliveryCost">;

export default function DeliveryForm({ initial }: { initial: FormState }) {
  const [threshold, setThreshold] = useState(String(initial.deliveryThreshold));
  const [cost, setCost] = useState(String(initial.deliveryCost));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);

    const thresholdNum = Number(threshold);
    const costNum = Number(cost);
    if (!Number.isFinite(thresholdNum) || thresholdNum < 0) {
      setError("Минимальная сумма должна быть числом от 0");
      return;
    }
    if (!Number.isFinite(costNum) || costNum < 0) {
      setError("Стоимость доставки должна быть числом от 0");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryThreshold: thresholdNum, deliveryCost: costNum }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось сохранить");
        return;
      }
      setSaved(true);
    } catch {
      setError("Не удалось сохранить. Проверьте соединение.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-xl2 border border-black/10 bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/70">
          Минимальная сумма заказа для доставки, ₽
        </label>
        <input
          value={threshold}
          onChange={(e) => {
            setThreshold(e.target.value);
            setSaved(false);
          }}
          type="number"
          min="0"
          className="w-full max-w-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-ink/50">
          Пока сумма корзины меньше этой цифры, кнопка «Оформить заказ» неактивна.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/70">
          Стоимость доставки, ₽
        </label>
        <input
          value={cost}
          onChange={(e) => {
            setCost(e.target.value);
            setSaved(false);
          }}
          type="number"
          min="0"
          className="w-full max-w-xs rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <p className="mt-1 text-xs text-ink/50">
          Показывается гостю в корзине справочно (0 — доставка бесплатная).
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !saving && <p className="text-sm text-green-700">Сохранено.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
