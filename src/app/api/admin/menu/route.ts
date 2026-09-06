import { NextResponse } from "next/server";
import { createMenuItem, parseComposition, parseStringArray } from "@/lib/menu-store";

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

  const sauceOptions = parseStringArray(body.sauceOptions);
  const composition = parseComposition(body.composition);
  const galleryPhotos = parseStringArray(body.galleryPhotos);

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
      composition,
      galleryPhotos,
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
