import Link from "next/link";
import Embers from "@/components/Embers";
import ScrollCarousel from "@/components/ScrollCarousel";
import { getSiteSettings } from "@/lib/siteSettings";
import { getReviews } from "@/lib/reviews";
import { phoneToTelHref } from "@/lib/phone";

export const dynamic = "force-dynamic";

const dishes = [
  {
    image: "/images/dish-assorti.jpg",
    alt: "Ассорти шашлыка на углях",
    tag: "С мангала",
    name: "Шашлычное ассорти",
    description:
      "Свинина, рёбра и мясо на кости — с углей, с печёным картофелем и соусами.",
  },
  {
    image: "/images/dish-lyulya.jpg",
    alt: "Люля-кебаб на шпажках",
    tag: "С мангала",
    name: "Люля-кебаб",
    description:
      "Сочный рубленый шашлык, подаётся с маринованным красным луком и соусом.",
  },
  {
    image: "/images/dish-khachapuri.jpg",
    alt: "Хачапури по-аджарски и по-имеретински",
    tag: "Из печи",
    name: "Хачапури",
    description:
      "По-имеретински — с сыром внутри, и по-аджарски — лодочкой, с яйцом сверху.",
  },
  {
    image: "/images/dish-vegetables.jpg",
    alt: "Овощи гриль на деревянной доске",
    tag: "С мангала",
    name: "Овощи на гриле",
    description:
      "Баклажан, кабачок, шампиньоны, помидор и перец — с чесночным соусом.",
  },
  {
    image: "/images/dish-cabbage-salad.jpg",
    alt: "Салат из краснокочанной капусты и овощей",
    tag: "Салаты",
    name: "Капустный салат",
    description:
      "Краснокочанная капуста, огурец, помидор и зелень — лёгкая заправка.",
  },
  {
    image: "/images/dish-cheese-salad.jpg",
    alt: "Салат с сыром и черри",
    tag: "Салаты",
    name: "Салат с сыром",
    description:
      "Листья салата, тёртый сыр, черри и соус — классика к любому блюду.",
  },
  {
    image: "/images/dish-veg-plate.jpg",
    alt: "Овощная тарелка с сыром сулугуни",
    tag: "Закуски",
    name: "Овощная тарелка",
    description: "Огурец, помидор, зелень и сыр — свежая закуска к столу.",
  },
];

export default async function HomePage() {
  const [settings, reviews] = await Promise.all([getSiteSettings(), getReviews()]);
  const aboutParagraphs = settings.aboutText.split("\n\n").filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-start overflow-hidden bg-char">
        <img
          src={settings.heroImageUrl}
          alt="Кафе Виктория вечером, набережная Енисея"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(18,13,10,0.4) 0%, rgba(16,12,9,0.58) 22%, rgba(15,11,9,0.72) 50%, rgba(13,10,8,0.9) 100%)",
          }}
        />
        <Embers count={16} />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-36 sm:pb-16 sm:pt-48">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-gold" />
            Кафе на Площади Мира · Красноярск
          </div>
          <h1 className="mt-5 text-6xl font-extrabold uppercase leading-[0.92] text-parchment-light sm:text-8xl">
            {settings.heroTitle}
          </h1>
          <p className="mt-5 max-w-lg text-lg font-medium text-parchment/90">
            {settings.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-sm bg-ember px-6 py-3.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
            >
              Смотреть меню
            </Link>
            <a
              href={settings.mapsUrl}
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
                {settings.ratingValue} · {settings.ratingCount} оценки на 2ГИС ↓
              </span>
            </a>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                Адрес
              </span>
              <span className="text-sm font-semibold text-parchment-light">
                {settings.address}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                Часы работы
              </span>
              <span className="text-sm font-semibold text-parchment-light">
                {settings.hours}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-warm py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
              О месте
            </span>
            <h2 className="mt-2.5 text-3xl font-bold text-parchment-light sm:text-4xl">
              Кухня на живом огне, у самой воды
            </h2>
            {aboutParagraphs.map((paragraph, i) => (
              <p key={i} className="mt-5 text-base leading-relaxed text-parchment/80 first:mt-5">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-px border border-river/20 bg-river/20 sm:grid-cols-2">
            {[
              { label: "Формат", value: "Кафе · гриль и грузинская кухня" },
              {
                label: "Рейтинг 2ГИС",
                value: `${settings.ratingValue} из 5 · ${settings.ratingCount} оценки`,
              },
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

      {/* Menu preview */}
      <section id="menu-preview" className="relative overflow-hidden bg-char py-20 sm:py-24">
        <Embers count={16} />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
                Меню
              </span>
              <h2 className="mt-2.5 text-3xl font-bold text-parchment-light sm:text-4xl">
                С мангала и из тандыра
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-parchment/60">
              Полное меню с ценами — у официанта в зале и на террасе. Здесь —
              фирменные позиции, за которые гости чаще всего хвалят «Викторию».
            </p>
          </div>

          <ScrollCarousel ariaLabel="блюдо">
            {dishes.map((dish) => (
              <article
                key={dish.name}
                className="flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-gold/20 bg-parchment-light transition hover:shadow-lg hover:shadow-black/30"
              >
                <div className="h-56 overflow-hidden">
                  <img
                    src={dish.image}
                    alt={dish.alt}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-1.5 p-5">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ember">
                    {dish.tag}
                  </span>
                  <h3 className="text-lg font-bold text-char">{dish.name}</h3>
                  <p className="text-sm leading-relaxed text-ink/70">
                    {dish.description}
                  </p>
                </div>
              </article>
            ))}
          </ScrollCarousel>

          <div className="mt-10 flex justify-center">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-sm bg-ember px-6 py-3.5 text-sm font-bold text-parchment-light transition hover:-translate-y-0.5 hover:bg-ember-light"
            >
              Посмотреть всё меню
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-warm py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
            Атмосфера
          </span>
          <h2 className="mb-10 mt-2.5 text-3xl font-bold text-parchment-light sm:text-4xl">
            {settings.atmosphereTitle}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-4">
          {settings.galleryImages.map((src, i) => (
            <div key={src + i} className="aspect-[4/5] overflow-hidden">
              <img
                src={src}
                alt={`${settings.atmosphereTitle} — фото ${i + 1}`}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>
          ))}
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
              {settings.ratingValue}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="tracking-[2px] text-gold">★★★★★</div>
              <span className="text-sm text-parchment/60">
                {settings.ratingCount} оценки на 2ГИС
              </span>
            </div>
          </div>

          {reviews.length > 0 && (
            <ScrollCarousel ariaLabel="отзыв">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="flex w-80 shrink-0 snap-start flex-col gap-4 border border-parchment/15 bg-parchment/5 p-7"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-river font-serif text-lg font-bold text-parchment-light">
                      {review.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-parchment-light">
                        {review.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-ash">
                        {review.dateLabel}
                      </div>
                    </div>
                  </div>
                  <div className="tracking-[2px] text-gold">
                    {"★".repeat(review.rating)}
                    <span className="text-parchment/20">
                      {"★".repeat(5 - review.rating)}
                    </span>
                  </div>
                  {review.checkAmount && (
                    <span className="font-mono text-[11px] tracking-wide text-gold">
                      Чек {review.checkAmount}
                    </span>
                  )}
                  <p className="text-sm leading-relaxed text-parchment/85">
                    {review.text}
                  </p>
                </article>
              ))}
            </ScrollCarousel>
          )}

          <div className="mt-10 flex justify-center">
            <a
              href={settings.mapsUrl}
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
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-gold">
              Как добраться
            </span>
            <h2 className="mb-6 mt-2.5 text-3xl font-bold text-parchment-light sm:text-4xl">
              {settings.address}
            </h2>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-parchment/10">
                  <td className="py-3 text-sm text-parchment/60">Часы работы</td>
                  <td className="py-3 text-right font-mono text-sm font-bold text-parchment-light">
                    {settings.hours}
                  </td>
                </tr>
              </tbody>
            </table>

            <ul className="mt-6 flex flex-col gap-3.5">
              <li className="flex items-baseline gap-3.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                  Телефон
                </span>
                <a
                  href={phoneToTelHref(settings.phone)}
                  className="border-b border-parchment/25 font-bold text-parchment-light"
                >
                  {settings.phone}
                </a>
              </li>
              {settings.phoneSecondary && (
                <li className="flex items-baseline gap-3.5 text-sm">
                  <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                    Телефон
                  </span>
                  <a
                    href={phoneToTelHref(settings.phoneSecondary)}
                    className="border-b border-parchment/25 font-bold text-parchment-light"
                  >
                    {settings.phoneSecondary}
                  </a>
                </li>
              )}
              <li className="flex items-baseline gap-3.5 text-sm">
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                  Адрес
                </span>
                <span className="text-parchment-light">{settings.address}</span>
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
              href={settings.mapsUrl}
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
