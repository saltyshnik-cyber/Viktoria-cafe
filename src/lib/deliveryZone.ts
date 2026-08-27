// Координаты кафе «Виктория» (Площадь Мира, 2а/1, Красноярск).
//
// ymaps.geocode() на предоставленном ключе стабильно возвращает
// "scriptError" (похоже, у ключа не включён доступ к Geocoder API —
// см. историю чата), поэтому вместо живого геокодирования используем
// координаты, уже сохранённые в настройках сайта (ссылка на 2ГИС для
// этого же адреса, site_settings.maps_url) — они получены геокодированием
// через 2ГИС при первоначальном наполнении сайта и указывают на ту же
// точку. Если реальные координаты кафе отличаются — поправьте константу.
export const CAFE_COORDS = { lat: 56.011237, lon: 92.896586 };

export const MAX_DELIVERY_RADIUS_KM = 7.5;

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Расстояние по прямой между двумя точками (формула гаверсинуса), в км. */
export function haversineDistanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function isWithinDeliveryZone(point: { lat: number; lon: number }): boolean {
  return haversineDistanceKm(CAFE_COORDS, point) <= MAX_DELIVERY_RADIUS_KM;
}
