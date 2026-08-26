import { NextResponse } from "next/server";
import { saveSiteSettings } from "@/lib/siteSettings";

export async function PATCH(request: Request) {
  const body = await request.json();

  try {
    await saveSiteSettings(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось сохранить настройки:", error);
    return NextResponse.json({ error: "Не удалось сохранить настройки" }, { status: 500 });
  }
}
