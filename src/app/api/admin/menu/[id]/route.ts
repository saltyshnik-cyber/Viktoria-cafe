import { NextResponse } from "next/server";
import { updateMenuItem, deleteMenuItem } from "@/lib/menu-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name?.trim() || !body.categoryId?.trim()) {
    return NextResponse.json(
      { error: "Заполните название и категорию" },
      { status: 400 },
    );
  }

  let price: number | undefined;
  if (body.price !== undefined && body.price !== null && body.price !== "") {
    const parsed = Number(body.price);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: "Цена должна быть положительным числом" },
        { status: 400 },
      );
    }
    price = parsed;
  }

  const sauceOptions: string[] = Array.isArray(body.sauceOptions)
    ? body.sauceOptions
        .map((option: unknown) => (typeof option === "string" ? option.trim() : ""))
        .filter((option: string) => option.length > 0)
    : [];

  try {
    const item = await updateMenuItem(id, {
      categoryId: body.categoryId,
      name: body.name,
      description: body.description ?? "",
      weight: body.weight ?? "",
      price,
      isPopular: Boolean(body.isPopular),
      photoUrl: body.photoUrl ?? "",
      isAvailable: body.isAvailable ?? true,
      sauceOptions,
    });

    if (!item) {
      return NextResponse.json({ error: "Блюдо не найдено" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Не удалось изменить блюдо:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить изменения" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const deleted = await deleteMenuItem(id);

    if (!deleted) {
      return NextResponse.json({ error: "Блюдо не найдено" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось удалить блюдо:", error);
    return NextResponse.json(
      { error: "Не удалось удалить блюдо" },
      { status: 500 },
    );
  }
}
