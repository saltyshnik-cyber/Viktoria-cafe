"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import type { PaymentMethod } from "@/types/order";
import { isBlank, isValidPhone } from "@/lib/validation";
import DeliveryMapPicker, {
  type DeliveryLocation,
  type DeliveryMapPickerHandle,
} from "@/components/DeliveryMapPicker";
import { geocodeAddress } from "@/lib/yandexGeocoder";
import { checkDeliveryZone } from "@/lib/deliveryZone";

const ADDRESS_GEOCODE_DEBOUNCE_MS = 900;

type FieldErrors = {
  name?: string;
  phone?: string;
  address?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Зону доставки можно проверить только когда есть координаты (клиент
  // подтвердил точку на карте) — если геокодирование недоступно и есть
  // только текст адреса, заказ не блокируем: оператор уточнит адрес сам.
  const zoneCheck = location ? checkDeliveryZone(location, location.address || address) : null;
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

  function handleAddressBlur() {
    if (forwardGeocodeTimerRef.current) {
      clearTimeout(forwardGeocodeTimerRef.current);
      forwardGeocodeTimerRef.current = null;
    }
    if (!isBlank(address)) void forwardGeocodeAddress(address);
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

    if (isBlank(address)) {
      errors.address = "Введите адрес доставки";
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
          address,
          lat: location?.lat,
          lon: location?.lon,
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
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
            }}
            aria-invalid={Boolean(fieldErrors.phone)}
            className={`w-full rounded-xl border bg-white px-4 py-2 text-ink outline-none focus:border-primary ${
              fieldErrors.phone ? "border-red-400" : "border-black/10"
            }`}
            placeholder="+7 (___) ___-__-__"
          />
          {fieldErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

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
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                paymentMethod === "card"
                  ? "border-primary bg-primary/5 text-ink"
                  : "border-black/10 text-ink/60"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                className="sr-only"
              />
              Онлайн картой
            </label>
            <label
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                paymentMethod === "cash"
                  ? "border-primary bg-primary/5 text-ink"
                  : "border-black/10 text-ink/60"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                className="sr-only"
              />
              Курьеру при получении
            </label>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isOutOfDeliveryZone}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-cream transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting
            ? "Отправляем..."
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
