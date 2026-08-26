import { NextResponse } from "next/server";
import { createCategory } from "@/lib/categories";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Введите название категории" }, { status: 400 });
  }

  try {
    const category = await createCategory({
      name: body.name.trim(),
      emoji: (body.emoji ?? "").trim(),
    });
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Не удалось добавить категорию:", error);
    return NextResponse.json({ error: "Не удалось добавить категорию" }, { status: 500 });
  }
}
