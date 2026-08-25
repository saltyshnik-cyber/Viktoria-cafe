"use client";

import { useEffect, useState } from "react";
import { categories } from "@/data/menu";

const STICKY_OFFSET = 130;

export default function CategoryNav() {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");

  useEffect(() => {
    const sections = categories
      .map((c) => ({ id: c.id, el: document.getElementById(c.id) }))
      .filter((s): s is { id: string; el: HTMLElement } => s.el !== null);

    if (sections.length === 0) return;

    let ticking = false;

    function updateActive() {
      ticking = false;

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(sections[sections.length - 1].id);
        return;
      }

      let current = sections[0].id;
      for (const s of sections) {
        if (s.el.getBoundingClientRect().top <= STICKY_OFFSET) {
          current = s.id;
        }
      }
      setActive(current);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    }

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="scrollbar-none sticky top-16 z-30 mx-auto flex max-w-6xl gap-2 overflow-x-auto border-b border-black/5 bg-cream/95 px-4 py-3 backdrop-blur">
      {categories.map((category) => {
        const isActive = active === category.id;
        return (
          <a
            key={category.id}
            href={`#${category.id}`}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              isActive
                ? "border-primary bg-primary text-cream"
                : "border-black/10 text-ink/70 hover:border-primary hover:text-primary"
            }`}
          >
            {category.emoji} {category.name}
          </a>
        );
      })}
    </nav>
  );
}
