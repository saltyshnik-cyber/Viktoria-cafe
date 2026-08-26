export default function Footer({
  phone,
  address,
  hours,
  deliveryThreshold,
}: {
  phone: string;
  address: string;
  hours: string;
  deliveryThreshold: number;
}) {
  return (
    <footer className="mt-16 border-t border-gold/10 bg-char text-parchment">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="mb-2 font-serif text-lg font-bold text-parchment-light">
            Кафе «Виктория»
          </div>
          <p className="text-sm text-parchment/60">
            Шашлык, хачапури и грузинская кухня на террасе с видом на Енисей.
          </p>
        </div>

        <div className="text-sm text-parchment/60">
          <div className="mb-2 font-semibold text-parchment-light">Контакты</div>
          <p>{phone}</p>
          <p>{address}</p>
          <p>{hours}</p>
        </div>

        <div className="text-sm text-parchment/60">
          <div className="mb-2 font-semibold text-parchment-light">
            Доставка и оплата
          </div>
          <p>Доставка по городу от {deliveryThreshold} ₽</p>
          <p>Оплата картой онлайн или наличными курьеру</p>
        </div>
      </div>

      <div className="border-t border-parchment/10 py-4 text-center text-xs text-ash">
        © {new Date().getFullYear()} Кафе «Виктория». Все права защищены.
      </div>
    </footer>
  );
}
