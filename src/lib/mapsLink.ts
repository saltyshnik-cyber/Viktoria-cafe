export function yandexMapPinUrl(lat: number, lon: number): string {
  return `https://yandex.ru/maps/?pt=${lon},${lat}&z=17&l=map`;
}
