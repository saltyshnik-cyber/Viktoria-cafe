"use client";

import { useRef } from "react";

export default function ScrollCarousel({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(":scope > *");
    const amount = (card?.getBoundingClientRect().width ?? 300) + 20;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={trackRef}
        className="scrollbar-none flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
      >
        {children}
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          aria-label={`Предыдущее: ${ariaLabel}`}
          onClick={() => scroll(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-parchment/30 text-parchment-light transition hover:border-ember hover:bg-ember"
        >
          ←
        </button>
        <button
          type="button"
          aria-label={`Следующее: ${ariaLabel}`}
          onClick={() => scroll(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-parchment/30 text-parchment-light transition hover:border-ember hover:bg-ember"
        >
          →
        </button>
      </div>
    </div>
  );
}
