"use client";

import { useState } from "react";
import { uploadPhoto } from "@/lib/uploadPhoto";

type PopupSettings = {
  popupEnabled: boolean;
  popupTitle: string;
  popupText: string;
  popupImageUrl: string;
};

export default function PopupSettingsForm({ initial }: { initial: PopupSettings }) {
  const [data, setData] = useState<PopupSettings>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof PopupSettings>(key: K, value: PopupSettings[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      update("popupImageUrl", url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) {
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

  const busy = saving || uploading;

  return (
    <section className="mt-8 rounded-xl2 border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Всплывающее окно на сайте</h2>
          <p className="mt-1 text-xs text-ink/50">
            Показывается посетителю один раз за визит и запоминается в браузере.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink/70">
          <input
            type="checkbox"
            checked={data.popupEnabled}
            onChange={(event) => update("popupEnabled", event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Показывать всплывающее окно на сайте
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-ink/70 sm:col-span-2">
          Заголовок
          <input
            value={data.popupTitle}
            onChange={(event) => update("popupTitle", event.target.value)}
            placeholder="Скидка 20% по будням"
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <label className="text-sm text-ink/70 sm:col-span-2">
          Текст акции
          <textarea
            value={data.popupText}
            onChange={(event) => update("popupText", event.target.value)}
            rows={3}
            placeholder="С 12:00 до 16:00 на всё меню, включая шашлык с мангала."
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </label>

        <div className="sm:col-span-2">
          <span className="mb-1 block text-sm text-ink/70">Картинка</span>
          <div className="flex flex-wrap items-center gap-3">
            {data.popupImageUrl && (
              <img
                src={data.popupImageUrl}
                alt=""
                className="h-24 w-36 rounded-xl border border-black/10 object-cover"
              />
            )}
            <label className="cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-sm text-ink/70 hover:border-primary hover:text-primary">
              {uploading ? "Загрузка…" : data.popupImageUrl ? "Заменить фото" : "Загрузить фото"}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                  event.target.value = "";
                }}
              />
            </label>
            {data.popupImageUrl && (
              <button
                type="button"
                onClick={() => update("popupImageUrl", "")}
                className="text-sm text-ink/50 hover:text-primary"
              >
                Убрать
              </button>
            )}
          </div>
          <input
            value={data.popupImageUrl}
            onChange={(event) => update("popupImageUrl", event.target.value)}
            placeholder="или вставьте ссылку на картинку"
            className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !busy && <p className="mt-3 text-sm text-green-700">Сохранено.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </section>
  );
}