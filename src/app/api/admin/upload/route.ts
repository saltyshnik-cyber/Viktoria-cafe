import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Serverless-функции Vercel режут тело запроса примерно на 4.5 МБ ещё до
// того, как выполнится этот код (тогда браузер получает 413 без единой
// строчки нашего JSON) — держим лимит чуть ниже этого потолка, чтобы хотя
// бы для файлов, которые всё же долетели, отдать понятное сообщение.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Разрешены только изображения (JPEG, PNG, WebP, GIF)" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой. Попробуйте выбрать фото поменьше." },
      { status: 413 },
    );
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка загрузки";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
