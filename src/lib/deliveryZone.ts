// Координаты кафе «Виктория» (Площадь Мира, 2а/1, Красноярск).
export const CAFE_COORDS = { lat: 56.011237, lon: 92.896586 };

export const MAX_DELIVERY_RADIUS_KM = 7.5;

// Районы, куда доставка не осуществляется, даже если адрес попадает в
// радиус по прямой (например, дальний берег/другой микрорайон без
// удобного проезда). Сверяется простым поиском подстроки в адресе,
// который вернул геокодер — отредактируйте список, если формулировка
// в реальных адресах отличается.
export const EXCLUDED_DISTRICTS = ["Солнечный", "Октябрьский", "Ольховка"];

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

/** Возвращает название найденного исключённого района, либо null. */
export function matchExcludedDistrict(addressText: string): string | null {
  const normalized = addressText.toLowerCase();
  return (
    EXCLUDED_DISTRICTS.find((district) => normalized.includes(district.toLowerCase())) ?? null
  );
}

export type DeliveryZoneCheck = { ok: true } | { ok: false; reason: string };

/** Проверяет и радиус, и список исключённых районов одним вызовом. */
export function checkDeliveryZone(
  point: { lat: number; lon: number },
  addressText: string,
): DeliveryZoneCheck {
  const distanceKm = haversineDistanceKm(CAFE_COORDS, point);
  if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
    return {
      ok: false,
      reason: "К сожалению, доставка по этому адресу недоступна — адрес вне зоны доставки.",
    };
  }

  const excludedDistrict = matchExcludedDistrict(addressText);
  if (excludedDistrict) {
    return {
      ok: false,
      reason: `К сожалению, доставка недоступна в район «${excludedDistrict}».`,
    };
  }

  return { ok: true };
}
