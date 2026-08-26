import { NextResponse } from "next/server";
import { updateReview, deleteReview } from "@/lib/reviews";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.name?.trim() || !body.text?.trim()) {
    return NextResponse.json({ error: "Заполните имя и текст отзыва" }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Рейтинг должен быть от 1 до 5" }, { status: 400 });
  }

  try {
    const review = await updateReview(id, {
      name: body.name.trim(),
      dateLabel: (body.dateLabel ?? "").trim(),
      rating,
      text: body.text.trim(),
      checkAmount: body.checkAmount?.trim() || null,
    });

    if (!review) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Не удалось изменить отзыв:", error);
    return NextResponse.json({ error: "Не удалось сохранить изменения" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const deleted = await deleteReview(id);
    if (!deleted) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось удалить отзыв:", error);
    return NextResponse.json({ error: "Не удалось удалить отзыв" }, { status: 500 });
  }
}
