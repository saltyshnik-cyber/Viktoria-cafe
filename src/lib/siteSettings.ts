import { ensureSchema, sql } from "@/lib/db";

export type SiteSettings = {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  aboutText: string;
  atmosphereTitle: string;
  galleryImages: string[];
  ratingValue: string;
  ratingCount: string;
  address: string;
  hours: string;
  phone: string;
  phoneSecondary: string;
  mapsUrl: string;
  deliveryThreshold: number;
  deliveryCost: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroTitle: "Виктория",
  heroSubtitle:
    "Шашлык, хачапури и грузинская кухня на террасе с видом на Енисей. Готовим на углях, каждый день — с 11:00 до полуночи.",
  heroImageUrl: "/images/hero.jpg",
  aboutText:
    "«Виктория» стоит на набережной у Площади Мира — просторный зал с панорамными окнами и открытая терраса с коваными грилями прямо над рекой. Мясо и овощи готовим на углях на глазах у гостей.\n\nВ меню — шашлык, люля-кебаб, хачапури из дровяной печи и грузинские салаты. Подходит и для семейного обеда, и для вечера компанией на террасе с видом на закат над Енисеем.",
  atmosphereTitle: "Зал, терраса, вид на реку",
  galleryImages: [
    "/images/gallery-1.jpg",
    "/images/gallery-2.jpg",
    "/images/gallery-3.jpg",
    "/images/gallery-4.jpg",
  ],
  ratingValue: "4.5",
  ratingCount: "604",
  address: "Площадь Мира, 2а/1, Красноярск",
  hours: "Ежедневно 11:00–24:00",
  phone: "+7 923 570-05-88",
  phoneSecondary: "+7 (391) 231-45-15",
  mapsUrl: "https://2gis.ru/krasnoyarsk/geo/70000001026596217/92.896586,56.011237",
  deliveryThreshold: 500,
  deliveryCost: 0,
};

// Ключи хранения в site_settings(key, value) — galleryImages сериализуется в JSON,
// deliveryThreshold/deliveryCost хранятся как строки чисел.
const KEY_MAP: Record<keyof SiteSettings, string> = {
  heroTitle: "hero_title",
  heroSubtitle: "hero_subtitle",
  heroImageUrl: "hero_image_url",
  aboutText: "about_text",
  atmosphereTitle: "atmosphere_title",
  galleryImages: "gallery_images",
  ratingValue: "rating_value",
  ratingCount: "rating_count",
  address: "address",
  hours: "hours",
  phone: "phone",
  phoneSecondary: "phone_secondary",
  mapsUrl: "maps_url",
  deliveryThreshold: "delivery_threshold",
  deliveryCost: "delivery_cost",
};

const NUMBER_FIELDS = new Set<keyof SiteSettings>(["deliveryThreshold", "deliveryCost"]);

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureSchema();
  const rows = (await sql`SELECT key, value FROM site_settings`) as {
    key: string;
    value: string;
  }[];
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const settings = { ...DEFAULT_SITE_SETTINGS };
  for (const field of Object.keys(KEY_MAP) as (keyof SiteSettings)[]) {
    const raw = byKey.get(KEY_MAP[field]);
    if (raw === undefined) continue;

    if (field === "galleryImages") {
      try {
        settings.galleryImages = JSON.parse(raw);
      } catch {
        // повреждённый JSON — оставляем дефолт
      }
    } else if (NUMBER_FIELDS.has(field)) {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        (settings as Record<string, unknown>)[field] = num;
      }
    } else {
      (settings as Record<string, unknown>)[field] = raw;
    }
  }
  return settings;
}

export async function saveSiteSettings(partial: Partial<SiteSettings>): Promise<void> {
  await ensureSchema();
  for (const field of Object.keys(partial) as (keyof SiteSettings)[]) {
    const key = KEY_MAP[field];
    const value =
      field === "galleryImages" ? JSON.stringify(partial.galleryImages) : String(partial[field]);
    await sql`
      INSERT INTO site_settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}

