import { NextResponse } from "next/server";
import { createMenuItem } from "@/lib/menu-store";

export async function POST(request: Request) {
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
    const item = await createMenuItem({
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

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Не удалось добавить блюдо:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить блюдо" },
      { status: 500 },
    );
  }
}
