"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/siteSettings";
import { uploadPhoto } from "@/lib/uploadPhoto";

type FormState = Pick<
  SiteSettings,
  | "heroTitle"
  | "heroSubtitle"
  | "heroImageUrl"
  | "aboutText"
  | "atmosphereTitle"
  | "galleryImages"
  | "ratingValue"
  | "ratingCount"
>;

export default function HomepageForm({ initial }: { initial: FormState }) {
  const [data, setData] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      update("heroImageUrl", url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleGalleryAdd(file: File) {
    if (data.galleryImages.length >= 4) {
      setError("Можно загрузить не больше 4 фотографий. Сначала удалите одну.");
      return;
    }
    setUploadingGallery("new");
    setError(null);
    try {
      const url = await uploadPhoto(file);
      update("galleryImages", [...data.galleryImages, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingGallery(null);
    }
  }

  async function handleGalleryReplace(index: number, file: File) {
    setUploadingGallery(index);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      const next = [...data.galleryImages];
      next[index] = url;
      update("galleryImages", next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingGallery(null);
    }
  }

  function handleGalleryRemove(index: number) {
    update(
      "galleryImages",
      data.galleryImages.filter((_, i) => i !== index),
    );
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

  const busy = saving || uploadingHero || uploadingGallery !== null;

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section className="rounded-xl2 border border-black/10 bg-white p-4">
        <h2 className="font-semibold text-ink">Заглавный блок (hero)</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Заголовок</label>
            <input
              value={data.heroTitle}
              onChange={(e) => update("heroTitle", e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Подзаголовок / описание
            </label>
            <textarea
              value={data.heroSubtitle}
              onChange={(e) => update("heroSubtitle", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Фоновая фотография
            </label>
            <div className="flex items-center gap-3">
              {data.heroImageUrl && (
                <img
                  src={data.heroImageUrl}
                  alt=""
                  className="h-20 w-32 rounded-xl border border-black/10 object-cover"
                />
              )}
              <label className="cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-sm text-ink/70 hover:border-primary hover:text-primary">
                {uploadingHero ? "Загрузка…" : "Заменить фото"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingHero}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleHeroUpload(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl2 border border-black/10 bg-white p-4">
        <h2 className="font-semibold text-ink">Блок «О месте»</h2>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-ink/70">Текст</label>
          <textarea
            value={data.aboutText}
            onChange={(e) => update("aboutText", e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-ink/50">
            Пустая строка между абзацами разделяет их на сайте.
          </p>
        </div>
      </section>

      <section className="rounded-xl2 border border-black/10 bg-white p-4">
        <h2 className="font-semibold text-ink">Блок «Атмосфера»</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">Заголовок</label>
            <input
              value={data.atmosphereTitle}
              onChange={(e) => update("atmosphereTitle", e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Фотографии (до 4 штук)
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.galleryImages.map((src, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <img
                    src={src}
                    alt=""
                    className="aspect-[4/5] w-full rounded-xl border border-black/10 object-cover"
                  />
                  <label className="cursor-pointer text-center text-xs text-ink/60 hover:text-primary">
                    {uploadingGallery === i ? "Загрузка…" : "Заменить"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingGallery !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGalleryReplace(i, file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGalleryRemove(i)}
                    className="text-center text-xs text-ink/60 hover:text-primary"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
            {data.galleryImages.length < 4 && (
              <label className="mt-3 inline-block cursor-pointer rounded-full border border-dashed border-black/20 px-3 py-1.5 text-sm text-ink/60 hover:border-primary hover:text-primary">
                {uploadingGallery === "new" ? "Загрузка…" : "+ Добавить фото"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingGallery !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleGalleryAdd(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl2 border border-black/10 bg-white p-4">
        <h2 className="font-semibold text-ink">Рейтинг</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Оценка (напр. 4.5)
            </label>
            <input
              value={data.ratingValue}
              onChange={(e) => update("ratingValue", e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink/70">
              Количество оценок (напр. 604)
            </label>
            <input
              value={data.ratingCount}
              onChange={(e) => update("ratingCount", e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !busy && <p className="text-sm text-green-700">Сохранено.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={busy}
        className="w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>
    </div>
  );
}
