"use client";

import { DAY_LABELS, closesNextDay, type DaySchedule, type WorkingHours } from "@/lib/businessHours";

const TIME_INPUT_CLASS =
  "w-28 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-black/5 disabled:opacity-40";

export default function WorkingHoursEditor({
  value,
  onChange,
}: {
  value: WorkingHours;
  onChange: (next: WorkingHours) => void;
}) {
  function updateDay(index: number, patch: Partial<DaySchedule>) {
    onChange(value.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((day, index) => {
        const label = DAY_LABELS[index];
        return (
          <div
            key={label}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-black/10 px-3 py-2"
          >
            <span className="w-7 text-sm font-semibold text-ink">{label}</span>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-ink/70 sm:order-last">
              <input
                type="checkbox"
                checked={day.isClosed}
                onChange={(e) => updateDay(index, { isClosed: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Выходной
            </label>
            <div className="flex basis-full items-center gap-2 sm:basis-auto">
              <input
                type="time"
                aria-label={`${label}: время открытия`}
                value={day.openTime}
                disabled={day.isClosed}
                onChange={(e) => updateDay(index, { openTime: e.target.value })}
                className={TIME_INPUT_CLASS}
              />
              <span className="text-ink/40">—</span>
              <input
                type="time"
                aria-label={`${label}: время закрытия`}
                value={day.closeTime}
                disabled={day.isClosed}
                onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                className={TIME_INPUT_CLASS}
              />
            </div>
            {!day.isClosed && closesNextDay(day) && (
              <p className="order-last basis-full text-xs text-ink/50">
                Закрытие на следующий день, в {day.closeTime}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
