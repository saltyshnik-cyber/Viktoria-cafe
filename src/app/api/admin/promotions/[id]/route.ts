import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import {
  deletePromotion,
  setPromotionEnabled,
  updatePromotion,
} from "@/lib/promotions-store";
import { toPromotionInput, validatePromotion } from "@/app/api/admin/promotions/route";

async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нужен вход в админку" }, { status: 401 });
  }

  const { id } = await params;
  const promotionId = Number(id);
  if (!Number.isInteger(promotionId)) {
    return NextResponse.json({ error: "Неверный id акции" }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  try {
    // Тумблер в списке присылает только isEnabled — полную валидацию не гоняем.
    if (typeof body.isEnabled === "boolean" && body.title === undefined) {
      const promotion = await setPromotionEnabled(promotionId, body.isEnabled);
      if (!promotion) {
        return NextResponse.json({ error: "Акция не найдена" }, { status: 404 });
      }
      return NextResponse.json({ promotion });
    }

    const error = validatePromotion(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const promotion = await updatePromotion(promotionId, await toPromotionInput(body));
    if (!promotion) {
      return NextResponse.json({ error: "Акция не найдена" }, { status: 404 });
    }

    return NextResponse.json({ promotion });
  } catch (caught) {
    console.error("Не удалось изменить акцию:", caught);
    return NextResponse.json({ error: "Не удалось сохранить изменения" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нужен вход в админку" }, { status: 401 });
  }

  const { id } = await params;
  const promotionId = Number(id);
  if (!Number.isInteger(promotionId)) {
    return NextResponse.json({ error: "Неверный id акции" }, { status: 400 });
  }

  try {
    const deleted = await deletePromotion(promotionId);
    if (!deleted) {
      return NextResponse.json({ error: "Акция не найдена" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось удалить акцию:", error);
    return NextResponse.json({ error: "Не удалось удалить акцию" }, { status: 500 });
  }
}