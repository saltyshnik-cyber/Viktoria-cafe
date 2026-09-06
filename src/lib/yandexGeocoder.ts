"use client";

// HTTP Geocoder API — отдельный продукт от JS API карты, поэтому у него
// свой ключ (NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY). Вызывается напрямую
// через fetch, а не через ymaps.geocode() — тот метод JS API использует
// ключ карты, у которого Геокодер как продукт не подключён.
const GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/";

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

async function requestGeocode(query: string): Promise<GeocodeResult | null> {
  const apiKey = getApiKey();
  const url = `${GEOCODER_URL}?apikey=${encodeURIComponent(apiKey)}&format=json&results=1&geocode=${encodeURIComponent(query)}`;

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

/** Прямое геокодирование: текстовый адрес → координаты. */
export async function geocodeAddress(text: string): Promise<GeocodeResult | null> {
  return requestGeocode(text);
}

/** Обратное геокодирование: координаты → текстовый адрес. */
export async function reverseGeocode(coords: [number, number]): Promise<GeocodeResult | null> {
  const [lat, lon] = coords;
  // У Геокодера запрос на обратное геокодирование — "долгота,широта",
  // в отличие от координат ymaps/Placemark ("широта,долгота").
  return requestGeocode(`${lon},${lat}`);
}
