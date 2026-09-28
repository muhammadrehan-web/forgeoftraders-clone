import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email) {
    return NextResponse.json({ error: "Please enter your email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = sql();
  const passwordHash = await hashPassword(password);
  const updated = await db`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE email = ${email}
    RETURNING id
  `;
  if (updated.length === 0) {
    return NextResponse.json({ error: "Account was not found. Register again." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
