export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="mb-2 text-lg font-bold">Кафе «Виктория»</div>
          <p className="text-sm text-cream/70">
            Домашняя кухня с доставкой по городу. Готовим из свежих продуктов каждый день.
          </p>
        </div>

        <div className="text-sm text-cream/70">
          <div className="mb-2 font-semibold text-cream">Контакты</div>
          <p>+7 (000) 000-00-00</p>
          <p>г. Город, ул. Примерная, 1</p>
          <p>Ежедневно, 10:00 – 22:00</p>
        </div>

        <div className="text-sm text-cream/70">
          <div className="mb-2 font-semibold text-cream">Доставка и оплата</div>
          <p>Доставка по городу от 500 ₽</p>
          <p>Оплата картой онлайн или наличными курьеру</p>
        </div>
      </div>

      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Кафе «Виктория». Все права защищены.
      </div>
    </footer>
  );
}
