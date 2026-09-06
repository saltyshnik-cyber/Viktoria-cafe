"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { loadYandexMaps } from "@/lib/yandexMapsLoader";
import { reverseGeocode } from "@/lib/yandexGeocoder";
import { CAFE_COORDS } from "@/lib/deliveryZone";

const DEFAULT_CENTER: [number, number] = [CAFE_COORDS.lat, CAFE_COORDS.lon];

export type DeliveryLocation = {
  lat: number;
  lon: number;
  address: string;
};

export type DeliveryMapPickerHandle = {
  /** Переместить метку и карту в указанную точку (без повторного геокодирования). */
  moveToCoords: (coords: [number, number]) => void;
};

const DeliveryMapPicker = forwardRef<
  DeliveryMapPickerHandle,
  {
    value: DeliveryLocation | null;
    onChange: (next: DeliveryLocation) => void;
  }
>(function DeliveryMapPicker({ value, onChange }, forwardedRef) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const placemarkRef = useRef<YmapsPlacemark | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = mapContainerRef.current;
    const initialCoords: [number, number] = value ? [value.lat, value.lon] : DEFAULT_CENTER;

    async function moveTo(coords: [number, number], doReverseGeocode: boolean) {
      placemarkRef.current?.geometry.setCoordinates(coords);
      mapRef.current?.setCenter(coords);
      if (!doReverseGeocode) return;

      setGeocoding(true);
      setGeocodeError(null);
      try {
        const result = await reverseGeocode(coords);
        if (cancelled) return;
        if (!result) {
          setGeocodeError("Не удалось определить адрес по этой точке. Введите его вручную ниже.");
          onChangeRef.current({ lat: coords[0], lon: coords[1], address: "" });
          return;
        }
        onChangeRef.current({ lat: coords[0], lon: coords[1], address: result.address });
      } catch (err) {
        console.error("Ошибка обратного геокодирования (карта → адрес):", err);
        if (cancelled) return;
        setGeocodeError("Не удалось определить адрес по этой точке. Введите его вручную ниже.");
        onChangeRef.current({ lat: coords[0], lon: coords[1], address: "" });
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    }

    loadYandexMaps()
      .then((ymaps) => {
        // ymaps.ready гарантирует, что API полностью инициализировано —
        // без этого карта может молча не отрисоваться.
        ymaps.ready(() => {
          if (cancelled || !container) return;
          const map = new ymaps.Map(container, {
            center: initialCoords,
            zoom: 15,
            controls: ["zoomControl"],
          });
          const placemark = new ymaps.Placemark(
            initialCoords,
            {},
            { preset: "islands#redDotIcon", draggable: true },
          );
          map.geoObjects.add(placemark);
          mapRef.current = map;
          placemarkRef.current = placemark;

          placemark.events.add("dragend", () => {
            void moveTo(placemark.geometry.getCoordinates(), true);
          });
          map.events.add("click", (e) => {
            void moveTo(e.get("coords"), true);
          });

          setMapReady(true);
          if (!value) void moveTo(initialCoords, true);
        });
      })
      .catch((err) => {
        console.error("Не удалось загрузить Яндекс.Карты:", err);
        setMapError(err instanceof Error ? err.message : "Не удалось загрузить карту");
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      placemarkRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    moveToCoords(coords: [number, number]) {
      placemarkRef.current?.geometry.setCoordinates(coords);
      mapRef.current?.setCenter(coords, 15);
    },
  }));

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapContainerRef}
        className="h-64 w-full overflow-hidden rounded-xl border border-black/10 sm:h-80"
      />
      {mapError && <p className="text-sm text-red-600">{mapError}</p>}
      {geocoding && <p className="text-sm text-ink/50">Определяем адрес…</p>}
      {geocodeError && !geocoding && <p className="text-sm text-red-600">{geocodeError}</p>}
      {mapReady && !mapError && !geocoding && !geocodeError && (
        <p className="text-xs text-ink/50">
          Перетащите метку или кликните на карте, чтобы указать точку доставки.
        </p>
      )}
    </div>
  );
});

export default DeliveryMapPicker;
