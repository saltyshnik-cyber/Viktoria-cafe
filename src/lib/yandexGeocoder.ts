"use client";

// HTTP Geocoder API — отдельный продукт от JS API карты, поэтому у него
// свой ключ (NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY). Вызывается напрямую
// через fetch, а не через ymaps.geocode() — тот метод JS API использует
// ключ карты, у которого Геокодер как продукт не подключён.
const GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/";

// Красноярск целиком с небольшим запасом за городской чертой (lon,lat).
// Без этого ограничения Геокодер иногда находит одноимённую улицу в
// совсем другом городе (например, "Ленина 1" — в Кирове), потому что
// запрос не содержит явного указания города.
const KRASNOYARSK_BBOX = "92.60,55.85~93.20,56.15";

export type GeocodeResult = {
  address: string;
  /** [широта, долгота] — тот же порядок, что у координат ymaps/Placemark. */
  coords: [number, number];
};

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY;
  if (!apiKey) {
    throw new Error("Не задан NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY");
  }
  return apiKey;
}

async function requestGeocode(
  query: string,
  options?: { restrictToKrasnoyarsk?: boolean },
): Promise<GeocodeResult | null> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    apikey: apiKey,
    format: "json",
    results: "1",
    geocode: query,
  });
  if (options?.restrictToKrasnoyarsk) {
    params.set("bbox", KRASNOYARSK_BBOX);
    params.set("rspn", "1");
  }
  const url = `${GEOCODER_URL}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Геокодер вернул ошибку ${response.status}`);
  }

  const data = await response.json();
  const member = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!member) return null;

  const pos: string | undefined = member.Point?.pos;
  if (!pos) return null;
  const [lon, lat] = pos.split(" ").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const address: string =
    member.metaDataProperty?.GeocoderMetaData?.text ?? member.name ?? "";

  return { address, coords: [lat, lon] };
}

/** Прямое геокодирование: текстовый адрес → координаты. Ограничено Красноярском. */
export async function geocodeAddress(text: string): Promise<GeocodeResult | null> {
  return requestGeocode(text, { restrictToKrasnoyarsk: true });
}

/** Обратное геокодирование: координаты → текстовый адрес. */
export async function reverseGeocode(coords: [number, number]): Promise<GeocodeResult | null> {
  const [lat, lon] = coords;
  // У Геокодера запрос на обратное геокодирование — "долгота,широта",
  // в отличие от координат ymaps/Placemark ("широта,долгота").
  return requestGeocode(`${lon},${lat}`);
}
