"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/siteSettings";

type FormState = Pick<SiteSettings, "address" | "hours" | "phone" | "phoneSecondary" | "mapsUrl">;

export default function ContactsForm({ initial }: { initial: FormState }) {
  const [data, setData] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
        <label className="mb-1 block text-sm font-medium text-ink/70">Адрес</label>
        <input
          value={data.address}
          onChange={(e) => update("address", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/70">Часы работы</label>
        <input
          value={data.hours}
          onChange={(e) => update("hours", e.target.value)}
          placeholder="Ежедневно 11:00–24:00"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">
            Телефон (основной)
          </label>
          <input
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/70">
            Телефон (дополнительный)
          </label>
          <input
            value={data.phoneSecondary}
            onChange={(e) => update("phoneSecondary", e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/70">Ссылка на 2ГИС</label>
        <input
          value={data.mapsUrl}
          onChange={(e) => update("mapsUrl", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
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
