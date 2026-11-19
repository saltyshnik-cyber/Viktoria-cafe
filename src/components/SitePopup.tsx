"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "victoria-popup-dismissed";
const SHOW_DELAY_MS = 600;

/**
 * Всплывающее окно с акцией. Показывается не чаще одного раза за визит:
 * отметка лежит в sessionStorage, поэтому переходы между страницами её не
 * сбрасывают, а закрытая вкладка — сбрасывает.
 *
 * Не показывается на оформлении и оплате: там посетитель уже принял решение,
 * и перекрывать форму заказа нельзя.
 */
export default function SitePopup({
  enabled,
  title,
  text,
  imageUrl,
}: {
  enabled: boolean;
  title: string;
  text: string;
  imageUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const hasContent = Boolean(title.trim() || text.trim() || imageUrl.trim());
  const onBlockedRoute =
    pathname.startsWith("/checkout") || pathname.startsWith("/order");

  useEffect(() => {
    if (!enabled || !hasContent || onBlockedRoute) return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // Приватный режим: sessionStorage недоступен — показываем без запоминания.
    }
    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, hasContent, onBlockedRoute]);

  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      lastFocusedRef.current?.focus();
    };
    // close не в зависимостях: он пересоздаётся каждый рендер, а эффект
    // должен срабатывать ровно на открытие и закрытие окна.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // не запомнилось — окно просто покажется в следующий раз
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Акция"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
      onClick={close}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-parchment-light shadow-xl sm:max-w-[680px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title || "Акция кафе «Виктория»"}
              className="max-h-[52vh] w-full object-cover"
            />
          )}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-lg text-white transition hover:bg-black/75"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {title && <h2 className="text-xl font-bold text-char">{title}</h2>}
          {text && (
            <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}