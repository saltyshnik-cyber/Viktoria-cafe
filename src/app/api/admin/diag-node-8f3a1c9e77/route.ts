import { NextResponse } from "next/server";

const DIAG_SECRET = "tmp-diag-8f3a1c9e77";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== DIAG_SECRET) {
    return NextResponse.json({ error: "no" }, { status: 404 });
  }

  const password = process.env.ADMIN_PASSWORD;
  const token = password ? await sha256Hex(`admin-session:${password}`) : null;

  return NextResponse.json({
    context: "node-route",
    hasPassword: Boolean(password),
    passwordLength: password?.length ?? 0,
    tokenPreview: token?.slice(0, 16) ?? null,
  });
}
