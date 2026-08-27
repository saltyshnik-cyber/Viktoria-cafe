"use client";

import { useEffect, useRef, useState } from "react";
import { loadYandexMaps } from "@/lib/yandexMapsLoader";

// Центр Красноярска — стартовая точка, пока клиент не передвинул метку.
const DEFAULT_CENTER: [number, number] = [56.0184, 92.8672];

export type DeliveryLocation = {
  lat: number;
  lon: number;
  address: string;
};

export default function DeliveryMapPicker({
  value,
  onChange,
}: {
  value: DeliveryLocation | null;
  onChange: (next: DeliveryLocation) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapsMap | null>(null);
  const placemarkRef = useRef<YmapsPlacemark | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = mapContainerRef.current;
    const initialCoords: [number, number] = value ? [value.lat, value.lon] : DEFAULT_CENTER;

    async function moveTo(coords: [number, number]) {
      placemarkRef.current?.geometry.setCoordinates(coords);
      setGeocoding(true);
      try {
        const result = await window.ymaps.geocode(coords);
        const geoObject = result.geoObjects.get(0);
        const address = geoObject?.getAddressLine() ?? "";
        if (!cancelled) onChangeRef.current({ lat: coords[0], lon: coords[1], address });
      } catch {
        if (!cancelled) onChangeRef.current({ lat: coords[0], lon: coords[1], address: "" });
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    }

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !container) return;
        const map = new ymaps.Map(container, {
          center: initialCoords,
          zoom: 16,
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
          void moveTo(placemark.geometry.getCoordinates());
        });
        map.events.add("click", (e) => {
          void moveTo(e.get("coords"));
        });

        setMapReady(true);
        if (!value) void moveTo(initialCoords);
      })
      .catch((err) => {
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

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapContainerRef}
        className="h-64 w-full overflow-hidden rounded-xl border border-black/10 sm:h-80"
      />
      {mapError && <p className="text-sm text-red-600">{mapError}</p>}
      {geocoding && <p className="text-sm text-ink/50">Определяем адрес…</p>}
      {mapReady && !mapError && !geocoding && (
        <p className="text-xs text-ink/50">
          Перетащите метку или кликните на карте, чтобы указать точку доставки.
        </p>
      )}
    </div>
  );
}
