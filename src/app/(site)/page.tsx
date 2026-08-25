import Link from "next/link";
import Embers from "@/components/Embers";

const MAPS_URL =
  "https://2gis.ru/krasnoyarsk/geo/70000001026596217/92.896586,56.011237";

const reviews = [
  {
    initial: "В",
    name: "Виктория Штунц",
    date: "23 июля 2026 · 9 отзывов",
    text: "Прекрасное, просторное место с красивым видом! Очень вкусно и с приемлемыми ценами. Отдельное спасибо персоналу и поварам — они сделали наш вечер уютным и вкусным.",
  },
  {
    initial: "S",
    name: "Safina",
    date: "21 июля 2026 · 6 отзывов",
    check: "Чек 500–1000 ₽",
    text: "Хорошее уютное кафе, готовят вкусно. Являемся постоянными клиентами, ни разу не было нареканий.",
  },
  {
    initial: "Л",
    name: "Люся П.",
    date: "20 июля 2026 · 31 отзыв",
    text: "Уже на протяжении нескольких лет заходим сюда за шашлыком, когда гуляем по набережной. Индейка выше всяких похвал, нежная и сочная!",
  },
  {
    initial: "Ю",
    name: "Юлия Николаева",
    date: "18 июля 2026 · 2 отзыва",
    text: "Всё очень вкусно, большой выбор блюд! Спасибо!",
  },
  {
    initial: "F",
    name: "fun time",
    date: "17 июля 2026 · 6 отзывов",
    text: "Отличное заведение, хорошее обслуживание, быстро. Дарья-официант просто шикарна — добрые и восхитительные впечатления.",
  },
  {
    initial: "И",
    name: "Ирина",
    date: "17 июля 2026 · 4 отзыва",
    text: "Отличное место! Обслуживание очень хорошее, шашлыки вообще огонь! Очень рекомендую 🥂",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-char py-24 sm:py-32">
        <Embers count={16} />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-gold" />
            Кафе на Площади Мира · Красноярск
          </div>
          <h1 className="mt-5 text-6xl font-extrabold uppercase leading-[0.92] text-parchment-light sm:text-8xl">
            Виктория
          </h1>
          <p className="mt-5 max-w-lg text-lg font-medium text-parchment/90">
            Шашлык, хачапури и грузинская кухня на террасе с видом на Енисей.
            Готовим на углях, каждый день — с 11:00 до полуночи.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-sm bg-ember px-6 py-3.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
            >
              Смотреть меню
            </Link>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-sm border border-parchment/40 px-6 py-3.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              Маршрут на 2ГИС
            </a>
          </div>

          <div className="mt-9 flex flex-wrap gap-y-3.5 gap-x-8 border-t border-parchment/15 pt-6">
            <a href="#otzyvy" className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                Рейтинг
              </span>
              <span className="text-sm font-semibold text-gold underline decoration-gold/40 underline-offset-4">
                4.5 · 604 оценки на 2ГИС ↓
              </span>
            </a>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                Адрес
              </span>
              <span className="text-sm font-semibold text-parchment-light">
                Площадь Мира, 2а/1
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                Часы работы
              </span>
              <span className="text-sm font-semibold text-parchment-light">
                Ежедневно 11:00–24:00
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-warm py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-river">
              О месте
            </span>
            <h2 className="mt-2.5 text-3xl font-bold text-char sm:text-4xl">
              Кухня на живом огне, у самой воды
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink/85">
              «Виктория» стоит на набережной у Площади Мира — просторный зал с
              панорамными окнами и открытая терраса с коваными грилями прямо
              над рекой. Мясо и овощи готовим на углях на глазах у гостей.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink/85">
              В меню — шашлык, люля-кебаб, хачапури из дровяной печи и
              грузинские салаты. Подходит и для семейного обеда, и для вечера
              компанией на террасе с видом на закат над Енисеем.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px border border-river/20 bg-river/20 sm:grid-cols-2">
            {[
              { label: "Формат", value: "Кафе · гриль и грузинская кухня" },
              { label: "Рейтинг 2ГИС", value: "4.5 из 5 · 604 оценки" },
              { label: "Средний чек", value: "500–1000 ₽" },
              { label: "Расположение", value: "1 этаж, вход с набережной" },
            ].map((fact) => (
              <div key={fact.label} className="bg-parchment-light p-6">
                <span className="mb-2.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-river">
                  {fact.label}
                </span>
                <span className="text-base font-bold leading-snug text-char">
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="otzyvy" className="relative overflow-hidden bg-char py-20 sm:py-24">
        <Embers count={16} />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
                Отзывы
              </span>
              <h2 className="mt-2.5 text-3xl font-bold text-parchment-light sm:text-4xl">
                Что говорят гости
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-parchment/60">
              Реальные отзывы с 2ГИС — про вид с террасы, шашлык из индейки и
              сервис.
            </p>
          </div>

          <div className="mb-11 flex flex-wrap items-center gap-5">
            <div className="font-serif text-5xl font-extrabold text-gold">
              4.5
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="tracking-[2px] text-gold">★★★★★</div>
              <span className="text-sm text-parchment/60">
                604 оценки на 2ГИС
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.name}
                className="flex flex-col gap-4 border border-parchment/15 bg-parchment/5 p-7"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-river font-serif text-lg font-bold text-parchment-light">
                    {review.initial}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-parchment-light">
                      {review.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-ash">
                      {review.date}
                    </div>
                  </div>
                </div>
                <div className="tracking-[2px] text-gold">★★★★★</div>
                {review.check && (
                  <span className="font-mono text-[11px] tracking-wide text-gold">
                    {review.check}
                  </span>
                )}
                <p className="text-sm leading-relaxed text-parchment/85">
                  {review.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-sm bg-ember px-6 py-3.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
            >
              Ещё отзывы на 2ГИС →
            </a>
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="kontakty" className="bg-warm py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 md:grid-cols-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-ember">
              Как добраться
            </span>
            <h2 className="mb-6 mt-2.5 text-3xl font-bold text-char sm:text-4xl">
              Площадь Мира, 2а/1
            </h2>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-ink/10">
                  <td className="py-3 text-sm text-ink/60">Ежедневно</td>
                  <td className="py-3 text-right font-mono text-sm font-bold text-char">
                    11:00 – 24:00
                  </td>
                </tr>
                <tr className="border-b border-ink/10">
                  <td className="py-3 text-sm text-ink/60">Район</td>
                  <td className="py-3 text-right font-mono text-sm font-bold text-char">
                    Центральный, Красноярск
                  </td>
                </tr>
              </tbody>
            </table>

            <ul className="mt-6 flex flex-col gap-3.5">
              <li className="flex items-baseline gap-3.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-river">
                  Телефон
                </span>
                <a
                  href="tel:+79235700588"
                  className="border-b border-ink/25 font-bold text-char"
                >
                  +7 923 570-05-88
                </a>
              </li>
              <li className="flex items-baseline gap-3.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-river">
                  Телефон
                </span>
                <a
                  href="tel:+73912314515"
                  className="border-b border-ink/25 font-bold text-char"
                >
                  +7 (391) 231-45-15
                </a>
              </li>
              <li className="flex items-baseline gap-3.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-river">
                  Адрес
                </span>
                <span className="text-char">
                  660049, Красноярск, Площадь Мира, 2а/1
                </span>
              </li>
            </ul>
          </div>

          <div className="border border-gold/15 bg-char p-9 text-parchment">
            <h3 className="mb-3 text-xl font-bold text-parchment-light">
              Найти на карте
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-parchment/70">
              Открыть карточку кафе «Виктория» в 2ГИС — точный вход, парковка
              рядом и маршрут от вашего адреса.
            </p>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-sm bg-ember px-6 py-3.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
            >
              Открыть в 2ГИС
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
