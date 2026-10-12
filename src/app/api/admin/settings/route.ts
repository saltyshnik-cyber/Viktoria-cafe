import { NextResponse } from "next/server";
import { saveSiteSettings } from "@/lib/siteSettings";
import { validateWorkingHours } from "@/lib/businessHours";

export async function PATCH(request: Request) {
  const body = await request.json();

  if (body.workingHours !== undefined) {
    const result = validateWorkingHours(body.workingHours);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    body.workingHours = result.value;
  }

  try {
    await saveSiteSettings(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Не удалось сохранить настройки:", error);
    return NextResponse.json({ error: "Не удалось сохранить настройки" }, { status: 500 });
  }
}
