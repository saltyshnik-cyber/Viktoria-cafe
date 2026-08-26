import { NextResponse } from "next/server";
import { updateCategory, deleteCategory, moveCategory } from "@/lib/categories";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  try {
    if (body.direction === "up" || body.direction === "down") {
      const moved = await moveCategory(id, body.direction);
      if (!moved) {
        return NextResponse.json({ error: "Нельзя переместить дальше" }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Введите название категории" }, { status: 400 });
    }

    const category = await updateCategory(id, {
      name: body.name.trim(),
      emoji: (body.emoji ?? "").trim(),
    });

    if (!category) {
      return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Не удалось изменить категорию:", error);
    return NextResponse.json({ error: "Не удалось сохранить изменения" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const result = await deleteCategory(id);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: `В этой категории ${result.itemCount} блюд(о). Сначала перенесите их в другую категорию или удалите.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось удалить категорию:", error);
    return NextResponse.json({ error: "Не удалось удалить категорию" }, { status: 500 });
  }
}
