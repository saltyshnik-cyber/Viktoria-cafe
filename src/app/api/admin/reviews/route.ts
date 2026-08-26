import { NextResponse } from "next/server";
import { createReview } from "@/lib/reviews";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name?.trim() || !body.text?.trim()) {
    return NextResponse.json({ error: "Заполните имя и текст отзыва" }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Рейтинг должен быть от 1 до 5" }, { status: 400 });
  }

  try {
    const review = await createReview({
      name: body.name.trim(),
      dateLabel: (body.dateLabel ?? "").trim(),
      rating,
      text: body.text.trim(),
      checkAmount: body.checkAmount?.trim() || null,
    });
    return NextResponse.json({ review });
  } catch (error) {
    console.error("Не удалось добавить отзыв:", error);
    return NextResponse.json({ error: "Не удалось добавить отзыв" }, { status: 500 });
  }
}
