import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import { createPromotion, getAllPromotions } from "@/lib/promotions-store";
import type { PromotionInput } from "@/lib/promotions-store";
import { PROMOTION_KINDS, PROMOTION_SCOPES } from "@/types/promotions";

const PERCENT_KINDS = ["percent_dish", "percent_category", "order_total"];

async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}

/** Проверки, общие для создания и редактирования. Возвращает текст ошибки. */
export function validatePromotion(body: Record<string, unknown>): string | null {
  if (typeof body.title !== "string" || !body.title.trim()) return "Введите название акции";

  const kind = String(body.kind ?? "");
  if (!(PROMOTION_KINDS as readonly string[]).includes(kind)) {
    return "Неизвестный тип акции";
  }

  const scope = String(body.scope ?? "");
  if (!(PROMOTION_SCOPES as readonly string[]).includes(scope)) {
    return "Неизвестная область действия";
  }

  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return "Укажите размер скидки больше нуля";
  if (PERCENT_KINDS.includes(kind) && (value < 1 || value > 100)) {
    return "Процент скидки должен быть от 1 до 100";
  }

  if (scope === "dishes" && !(Array.isArray(body.dishIds) && body.dishIds.length > 0)) {
    return "Выберите хотя бы одно блюдо";
  }
  if (scope === "categories" && !(Array.isArray(body.categoryIds) && body.categoryIds.length > 0)) {
    return "Выберите хотя бы одну категорию";
  }

  const startsAt = typeof body.startsAt === "string" && body.startsAt ? body.startsAt : null;
  const endsAt = typeof body.endsAt === "string" && body.endsAt ? body.endsAt : null;
  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return "Дата окончания должна быть позже даты начала";
  }

  return null;
}

export async function toPromotionInput(
  body: Record<string, unknown>,
): Promise<PromotionInput> {
  const asString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value.trim() : null;
  const asList = (value: unknown): string[] =>
    Array.isArray(value) ? value.map(String).filter(Boolean) : [];

  return {
    title: String(body.title).trim(),
    description: asString(body.description),
    imageUrl: asString(body.imageUrl),
    kind: body.kind as PromotionInput["kind"],
    value: Number(body.value),
    maxDiscount:
      body.maxDiscount === null || body.maxDiscount === undefined || body.maxDiscount === ""
        ? null
        : Number(body.maxDiscount),
    minOrderTotal: Number(body.minOrderTotal ?? 0) || 0,
    scope: body.scope as PromotionInput["scope"],
    dishIds: asList(body.dishIds),
    categoryIds: asList(body.categoryIds),
    startsAt: asString(body.startsAt),
    endsAt: asString(body.endsAt),
    weekdays: Array.isArray(body.weekdays) ? body.weekdays.map(Number) : null,
    timeFrom: asString(body.timeFrom),
    timeTo: asString(body.timeTo),
    priority: Number(body.priority ?? 0) || 0,
    stackable: Boolean(body.stackable),
    isEnabled: body.isEnabled === undefined ? true : Boolean(body.isEnabled),
    updatedBy: "admin",
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нужен вход в админку" }, { status: 401 });
  }

  try {
    return NextResponse.json({ promotions: await getAllPromotions() });
  } catch (error) {
    console.error("Не удалось получить акции:", error);
    return NextResponse.json({ error: "Не удалось получить акции" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нужен вход в админку" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const error = validatePromotion(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const promotion = await createPromotion(await toPromotionInput(body));
    return NextResponse.json({ promotion });
  } catch (caught) {
    console.error("Не удалось создать акцию:", caught);
    return NextResponse.json({ error: "Не удалось сохранить акцию" }, { status: 500 });
  }
}