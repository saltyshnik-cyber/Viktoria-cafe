"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import type { DeliveryType, PaymentMethod } from "@/types/order";
import { DELIVERY_TYPE_LABELS } from "@/lib/orderLabels";
import { isBlank, isValidPhone } from "@/lib/validation";
import DeliveryMapPicker, {
  type DeliveryLocation,
  type DeliveryMapPickerHandle,
} from "@/components/DeliveryMapPicker";
import { geocodeAddress } from "@/lib/yandexGeocoder";
import { checkDeliveryZone } from "@/lib/deliveryZone";

const ADDRESS_GEOCODE_DEBOUNCE_MS = 900;
// Перепроверяем часы работы раз в минуту, пока клиент сидит на странице —
// чтобы кнопка сама разблокировалась/заблокировалась на границе 12:00/00:00.
const BUSINESS_HOURS_POLL_MS = 60_000;

type FieldErrors = {
  name?: string;
  phone?: string;
  address?: string;
  consent?: string;
};

export default function CheckoutForm({
  cafeAddress,
  cafePhone,
}: {
  cafeAddress: string;
  cafePhone: string;
}) {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const isPickup = deliveryType === "pickup";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [comment, setComment] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  // Онлайн-оплата картой (ЮKassa) временно скрыта с витрины — код интеграции
  // сохранён, чтобы вернуть вариант "card" в форму, достаточно снова показать его ниже.
  const [paymentMethod] = useState<PaymentMethod>("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // null, пока не пришёл первый ответ сервера — до этого не блокируем кнопку,
  // чтобы не мигать сообщением "не работаем" на каждой загрузке страницы.
  const [closedMessage, setClosedMessage] = useState<string | null>(null);
  const [hasCheckedBusinessHours, setHasCheckedBusinessHours] = useState(false);
  const isClosed = hasCheckedBusinessHours && closedMessage !== null;

  // Зону доставки можно проверить только когда есть координаты (клиент
  // подтвердил точку на карте) — если геокодирование недоступно и есть
  // только текст адреса, заказ не блокируем: оператор уточнит адрес сам.
  // При самовывозе зона доставки не применяется вовсе.
  const zoneCheck =
    !isPickup && location ? checkDeliveryZone(location, location.address || address) : null;
  const isOutOfDeliveryZone = zoneCheck !== null && !zoneCheck.ok;

  const mapPickerRef = useRef<DeliveryMapPickerHandle>(null);
  // Ставится в true, когда адрес заполнился ИЗ карты (обратное геокодирование) —
  // чтобы не запускать прямое геокодирование этого же текста обратно на себя.
  const skipNextForwardGeocodeRef = useRef(false);
  const forwardGeocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function forwardGeocodeAddress(text: string) {
    try {
      const result = await geocodeAddress(text);
      if (!result) return; // адрес не найден — метку не двигаем, текст оставляем как есть

      mapPickerRef.current?.moveToCoords(result.coords);
      setLocation({ lat: result.coords[0], lon: result.coords[1], address: text });
      if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined }));
    } catch (err) {
      console.error("Ошибка прямого геокодирования (адрес → карта):", err);
      // Не найден/ошибка сети — оставляем как есть, клиент может оформить
      // заказ с введённым вручную текстом без точки на карте.
    }
  }

  useEffect(() => {
    // Флаг должен сбрасываться на каждое изменение address, даже если новое
    // значение пустое — иначе он "залипнет" и погасит следующий реальный ввод.
    if (skipNextForwardGeocodeRef.current) {
      skipNextForwardGeocodeRef.current = false;
      return;
    }
    if (isBlank(address)) return;
    forwardGeocodeTimerRef.current = setTimeout(() => {
      void forwardGeocodeAddress(address);
    }, ADDRESS_GEOCODE_DEBOUNCE_MS);
    return () => {
      if (forwardGeocodeTimerRef.current) clearTimeout(forwardGeocodeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    let cancelled = false;

    async function checkBusinessHours() {
      try {
        const response = await fetch("/api/business-hours");
        const data = await response.json();
        if (cancelled) return;
        setClosedMessage(data.open ? null : data.message);
      } catch {
        // Сеть недоступна — не блокируем оформление из-за этого; финальную
        // проверку всё равно сделает сервер при отправке заказа.
      } finally {
        if (!cancelled) setHasCheckedBusinessHours(true);
      }
    }

    void checkBusinessHours();
    const interval = setInterval(checkBusinessHours, BUSINESS_HOURS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handlePhoneChange(raw: string) {
    // "+7" — несъёмный префикс: оставляем только цифры, введённые после
    // него, отбрасывая случайно напечатанную лишнюю "7" в начале.
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("7")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    setPhone(`+7${digits}`);
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
  }

  function handleAddressBlur() {
    if (forwardGeocodeTimerRef.current) {
      clearTimeout(forwardGeocodeTimerRef.current);
      forwardGeocodeTimerRef.current = null;
    }
    if (!isBlank(address)) void forwardGeocodeAddress(address);
  }

  function handleDeliveryTypeChange(next: DeliveryType) {
    setDeliveryType(next);
    setError(null);
    if (next === "pickup") {
      // Отложенное геокодирование уже скрытого адреса не должно сработать после переключения.
      if (forwardGeocodeTimerRef.current) {
        clearTimeout(forwardGeocodeTimerRef.current);
        forwardGeocodeTimerRef.current = null;
      }
      setFieldErrors((prev) => ({ ...prev, address: undefined }));
    }
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (isBlank(name)) {
      errors.name = "Введите имя";
    }

    if (isBlank(phone)) {
      errors.phone = "Введите телефон";
    } else if (!isValidPhone(phone)) {
      errors.phone = "Введите телефон в формате +7XXXXXXXXXX";
    }

    if (!isPickup && isBlank(address)) {
      errors.address = "Введите адрес доставки";
    }

    if (!consentGiven) {
      errors.consent = "Нужно согласие на обработку персональных данных";
    }

    return errors;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Корзина пуста</h1>
        <p className="mt-2 text-ink/60">
          Добавьте блюда из меню, чтобы оформить заказ.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-cream hover:bg-primary-dark"
        >
          Перейти к меню
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (isClosed && closedMessage) {
      setError(closedMessage);
      return;
    }

    if (isOutOfDeliveryZone && zoneCheck && !zoneCheck.ok) {
      setError(zoneCheck.reason);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          deliveryType,
          address: isPickup ? "" : address,
          lat: isPickup ? undefined : location?.lat,
          lon: isPickup ? undefined : location?.lon,
          comment: comment || undefined,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            sauce: item.sauce,
          })),
          totalPrice,
          paymentMethod,
          consent: consentGiven,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Не удалось оформить заказ");
        return;
      }

      clearCart();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      router.push(`/order/${data.orderId}`);
    } catch {
      setError("Не удалось отправить заказ. Проверьте соединение и попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Оформление заказа</h1>

      <ul className="mt-6 divide-y divide-black/5 rounded-xl2 border border-black/5 bg-white px-4">
        {items.map((item) => (
          <li
            key={`${item.id}::${item.sauce ?? ""}`}
            className="flex items-center justify-between py-3 text-sm"
          >
            <span className="text-ink/70">
              {item.name}
              {item.sauce ? ` (соус: ${item.sauce})` : ""} × {item.quantity}
            </span>
            <span className="font-medium text-ink">
              {item.price * item.quantity} ₽
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between py-3 font-semibold text-ink">
          <span>Итого</span>
          <span>{totalPrice} ₽</span>
        </li>
      </ul>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div>
          <span id="delivery-type-label" className="mb-1 block text-sm font-medium text-ink/70">
            Способ получения
          </span>
          <div
            role="radiogroup"
            aria-labelledby="delivery-type-label"
            className="grid grid-cols-2 gap-2"
          >
            {(["delivery", "pickup"] as const).map((type) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={deliveryType === type}
                onClick={() => handleDeliveryTypeChange(type)}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  deliveryType === type
                    ? "border-primary bg-primary/10 text-ink"
                    : "border-black/10 bg-white text-ink/60 hover:border-primary/50"
                }`}
              >
                {type === "delivery" ? "🚚" : "🏃"} {DELIVERY_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink/70">
            Имя
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            className={`w-full rounded-xl border bg-white px-4 py-2 text-ink outline-none focus:border-primary ${
              fieldErrors.name ? "border-red-400" : "border-black/10"
            }`}
            placeholder="Как к вам обращаться"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink/70">
            Телефон
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onKeyDown={(e) => {
              const el = e.currentTarget;
              // Не даём стереть "+7" бэкспейсом/делитом, когда курсор внутри префикса.
              if (
                (e.key === "Backspace" || e.key === "Delete") &&
                el.selectionStart !== null &&
                el.selectionEnd !== null &&
                el.selectionStart <= 2 &&
                el.selectionEnd <= 2
              ) {
                e.preventDefault();
              }
            }}
            aria-invalid={Boolean(fieldErrors.phone)}
            className={`w-full rounded-xl border bg-white px-4 py-2 text-ink outline-none focus:border-primary ${
              fieldErrors.phone ? "border-red-400" : "border-black/10"
            }`}
            placeholder="+7XXXXXXXXXX"
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

        {isPickup ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-ink">
            <div>
              Заберите заказ по адресу: <span className="font-semibold">{cafeAddress}</span>
            </div>
            {cafePhone && (
              <div className="mt-1 text-ink/70">
                Телефон:{" "}
                <a
                  href={`tel:${cafePhone.replace(/[^\d+]/g, "")}`}
                  className="text-primary hover:underline"
                >
                  {cafePhone}
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <div>
              <span className="mb-1 block text-sm font-medium text-ink/70">
                Точка доставки на карте
              </span>
              <DeliveryMapPicker
                ref={mapPickerRef}
                value={location}
                onChange={(next) => {
                  skipNextForwardGeocodeRef.current = true;
                  setLocation(next);
                  setAddress(next.address);
                  if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: undefined });
                }}
              />
              {isOutOfDeliveryZone && zoneCheck && !zoneCheck.ok && (
                <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {zoneCheck.reason}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="mb-1 block text-sm font-medium text-ink/70">
                Адрес доставки
              </label>
              <input
                id="address"
                required
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: undefined });
                }}
                onBlur={handleAddressBlur}
                aria-invalid={Boolean(fieldErrors.address)}
                className={`w-full rounded-xl border bg-white px-4 py-2 text-ink outline-none focus:border-primary ${
                  fieldErrors.address ? "border-red-400" : "border-black/10"
                }`}
                placeholder="Улица, дом, квартира/офис"
              />
              {fieldErrors.address ? (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
              ) : (
                <p className="mt-1 text-xs text-ink/50">
                  Адрес подставляется по метке на карте — можно поправить вручную,
                  если не нашли нужную точку.
                </p>
              )}
            </div>
          </>
        )}

        <div>
          <label htmlFor="comment" className="mb-1 block text-sm font-medium text-ink/70">
            Комментарий к заказу
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-ink outline-none focus:border-primary"
            placeholder="Домофон, этаж, пожелания к заказу"
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-ink/70">
            Способ оплаты
          </span>
          <div className="rounded-xl border border-primary bg-primary/5 px-4 py-3 text-sm text-ink">
            Курьеру при получении
            <span className="block text-xs text-ink/60">картой или наличными</span>
          </div>
        </div>

        <div>
          <label className="flex items-start gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => {
                setConsentGiven(e.target.checked);
                if (fieldErrors.consent) setFieldErrors({ ...fieldErrors, consent: undefined });
              }}
              aria-invalid={Boolean(fieldErrors.consent)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            <span>
              Согласен на обработку персональных данных в соответствии с{" "}
              <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                политикой конфиденциальности
              </Link>
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.consent}</p>
          )}
        </div>

        {isClosed && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {closedMessage}
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isOutOfDeliveryZone || isClosed}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? "Отправляем..."
            : isClosed
              ? "Сейчас не работаем"
              : isOutOfDeliveryZone
                ? "Адрес вне зоны доставки"
                : paymentMethod === "card"
                  ? `Оплатить ${totalPrice} ₽`
                  : `Подтвердить заказ на ${totalPrice} ₽`}
        </button>
      </form>
    </div>
  );
}
