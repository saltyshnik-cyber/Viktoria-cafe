"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MenuItem } from "@/types/menu";
import AddToCartControl from "@/components/AddToCartControl";

export default function MenuItemModal({
  item,
  price,
  onClose,
}: {
  item: MenuItem;
  price: number;
  onClose: () => void;
}) {
  const photos = [item.photoUrl, ...(item.galleryPhotos ?? [])].filter(
    (url): url is string => Boolean(url),
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const slide = track?.children[index];
    if (slide instanceof HTMLElement) {
      slide.scrollIntoView({ behavior: "instant", inline: "start", block: "nearest" });
    }
  }

  function handleTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-parchment-light sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 bg-warm">
          {photos.length > 0 ? (
            <div
              ref={trackRef}
              onScroll={handleTrackScroll}
              className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
            >
              {photos.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`${item.name} — фото ${index + 1}`}
                  className="aspect-square w-full shrink-0 snap-start object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-6xl">🍽️</div>
          )}

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition hover:bg-black/60"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                onClick={() => scrollToIndex(Math.min(photos.length - 1, activeIndex + 1))}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white transition hover:bg-black/60"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      index === activeIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            aria-label="Закрыть"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-lg text-white transition hover:bg-black/70"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-bold text-char">{item.name}</h2>

          {item.description && (
            <p className="mt-2 text-sm text-ink/70">{item.description}</p>
          )}

          {item.composition && item.composition.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-ink/60">
              {item.composition.map((component, index) => (
                <li key={index}>
                  {component.name}
                  {component.quantity > 1 ? ` × ${component.quantity}` : ""}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center pt-1">
            {item.weight && <span className="text-sm text-ink/50">{item.weight}</span>}
            <span className="ml-auto text-lg font-semibold text-char">{price} ₽</span>
          </div>

          <div className="mt-3">
            <AddToCartControl item={item} price={price} size="lg" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
