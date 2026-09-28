import { NextResponse } from "next/server";
import { isWithinBusinessHours, CLOSED_ORDER_MESSAGE } from "@/lib/businessHours";

export const dynamic = "force-dynamic";

export async function GET() {
  const open = isWithinBusinessHours();
  return NextResponse.json({ open, message: open ? null : CLOSED_ORDER_MESSAGE });
}
