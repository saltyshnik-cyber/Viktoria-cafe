import { NextResponse } from "next/server";
import { updateMenuItem, deleteMenuItem } from "@/lib/menu-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (
    !body.name?.trim() ||
    !body.categoryId?.trim() ||
    typeof body.price !== "number" ||
    body.price <= 0
  ) {
    return NextResponse.json(
      { error: "Заполните название, категорию и цену" },
      { status: 400 },
    );
  }

  try {
    const item = updateMenuItem(id, {
      categoryId: body.categoryId,
      name: body.name,
      description: body.description ?? "",
      weight: body.weight ?? "",
      price: body.price,
      isPopular: Boolean(body.isPopular),
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
    const deleted = deleteMenuItem(id);

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
