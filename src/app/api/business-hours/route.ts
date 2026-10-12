import { NextResponse } from "next/server";
import { getOrderAvailability } from "@/lib/businessHours";
import { getWorkingHours } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { open, message } = getOrderAvailability(await getWorkingHours());
  return NextResponse.json({ open, message });
}
