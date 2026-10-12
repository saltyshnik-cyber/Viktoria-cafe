// Расписание работы кафе — по времени Красноярска (UTC+7, без перехода на
// летнее/зимнее время), независимо от часового пояса сервера или клиента.
// Модуль чистый (без БД), поэтому его можно использовать и на клиенте.
export const BUSINESS_HOURS_TIMEZONE = "Asia/Krasnoyarsk";

export type DaySchedule = {
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"; "00:00" — закрытие в полночь
  isClosed: boolean;
};

// Индекс 0 — понедельник, 6 — воскресенье.
export type WorkingHours = DaySchedule[];

export const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const DEFAULT_OPEN_TIME = "12:00";
const DEFAULT_CLOSE_TIME = "00:00";

// Совпадает с прежними жёсткими часами приёма заказов (12:00–24:00).
export const DEFAULT_WORKING_HOURS: WorkingHours = DAY_LABELS.map(() => ({
  openTime: DEFAULT_OPEN_TIME,
  closeTime: DEFAULT_CLOSE_TIME,
  isClosed: false,
}));

export const CLOSED_TODAY_MESSAGE = "Сегодня кафе не работает";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function toMinutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

/** Закрытие не позже открытия (кроме 00:00) означает «закрываемся на следующий день». */
export function closesNextDay(day: Pick<DaySchedule, "openTime" | "closeTime">): boolean {
  return day.closeTime !== "00:00" && toMinutes(day.closeTime) <= toMinutes(day.openTime);
}

export type WorkingHoursValidation =
  | { ok: true; value: WorkingHours }
  | { ok: false; error: string };

export function validateWorkingHours(raw: unknown): WorkingHoursValidation {
  if (!Array.isArray(raw) || raw.length !== 7) {
    return { ok: false, error: "Расписание должно содержать 7 дней" };
  }

  const value: WorkingHours = [];
  for (let i = 0; i < 7; i++) {
    const day = raw[i] as Partial<DaySchedule> | null;
    const label = DAY_LABELS[i];

    if (!day || typeof day !== "object" || typeof day.isClosed !== "boolean") {
      return { ok: false, error: `${label}: некорректные данные` };
    }

    if (day.isClosed) {
      // У выходного время не важно — но сохраняем, чтобы при снятии галочки
      // в форме вернулись прежние значения.
      value.push({
        openTime: isValidTime(day.openTime) ? day.openTime : DEFAULT_OPEN_TIME,
        closeTime: isValidTime(day.closeTime) ? day.closeTime : DEFAULT_CLOSE_TIME,
        isClosed: true,
      });
      continue;
    }

    if (!isValidTime(day.openTime)) {
      return { ok: false, error: `${label}: укажите время открытия` };
    }
    if (!isValidTime(day.closeTime)) {
      return { ok: false, error: `${label}: укажите время закрытия` };
    }
    if (day.openTime === day.closeTime) {
      return { ok: false, error: `${label}: время открытия и закрытия не должны совпадать` };
    }
    value.push({ openTime: day.openTime, closeTime: day.closeTime, isClosed: false });
  }

  return { ok: true, value };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/** День недели (0 — пн) и минуты от полуночи по Красноярску. */
export function getLocalNow(date: Date = new Date()): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_HOURS_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    dayIndex: WEEKDAY_INDEX[get("weekday")],
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

export type OrderAvailability = { open: boolean; message: string | null };

export function getOrderAvailability(
  schedule: WorkingHours,
  date: Date = new Date(),
): OrderAvailability {
  const { dayIndex, minutes } = getLocalNow(date);
  const today = schedule[dayIndex];
  const yesterday = schedule[(dayIndex + 6) % 7];

  if (!today.isClosed) {
    const open = toMinutes(today.openTime);
    const close = toMinutes(today.closeTime);
    // Закрытие в 00:00 (close = 0) попадает в ветку «до конца суток».
    const isOpenNow = close > open ? minutes >= open && minutes < close : minutes >= open;
    if (isOpenNow) return { open: true, message: null };
  }

  // Вчерашняя смена, перетекающая за полночь (например, 18:00–02:00).
  if (!yesterday.isClosed && closesNextDay(yesterday) && minutes < toMinutes(yesterday.closeTime)) {
    return { open: true, message: null };
  }

  if (today.isClosed) {
    return { open: false, message: CLOSED_TODAY_MESSAGE };
  }

  return {
    open: false,
    message: `Приём заказов сегодня с ${today.openTime} до ${today.closeTime}. Сейчас мы не работаем — оформить заказ можно после открытия.`,
  };
}

/** Строки для вывода на сайте: «Ежедневно 12:00–00:00» или «Пн–Пт 12:00–00:00», «Вс — выходной». */
export function formatWorkingHoursLines(schedule: WorkingHours): string[] {
  if (schedule.every((day) => day.isClosed)) return ["Кафе не работает"];

  const describe = (day: DaySchedule) =>
    day.isClosed ? "выходной" : `${day.openTime}–${day.closeTime}`;

  const groups: { from: number; to: number; text: string }[] = [];
  schedule.forEach((day, index) => {
    const text = describe(day);
    const last = groups[groups.length - 1];
    if (last && last.text === text) {
      last.to = index;
    } else {
      groups.push({ from: index, to: index, text });
    }
  });

  if (groups.length === 1) return [`Ежедневно ${groups[0].text}`];

  return groups.map((group) => {
    const label =
      group.from === group.to
        ? DAY_LABELS[group.from]
        : `${DAY_LABELS[group.from]}–${DAY_LABELS[group.to]}`;
    return group.text === "выходной" ? `${label} — выходной` : `${label} ${group.text}`;
  });
}
