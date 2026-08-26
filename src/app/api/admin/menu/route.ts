import { NextResponse } from "next/server";
import { createMenuItem } from "@/lib/menu-store";

export async function POST(request: Request) {
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
    const item = await createMenuItem({
      categoryId: body.categoryId,
      name: body.name,
      description: body.description ?? "",
      weight: body.weight ?? "",
      price: body.price,
      isPopular: Boolean(body.isPopular),
      photoUrl: body.photoUrl ?? "",
      isAvailable: body.isAvailable ?? true,
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
