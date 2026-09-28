import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const token = String(body?.token || "").trim();
  const password = String(body?.password || "");
  if (!token) {
    return NextResponse.json({ error: "This reset link is not valid." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = sql();
  const rows = await db`
    SELECT user_id
    FROM password_resets
    WHERE token = ${token}
      AND expires_at > now()
    LIMIT 1
  `;
  if (!rows.length) {
    return NextResponse.json({ error: "This reset link has expired. Request a new one." }, { status: 400 });
  }

  const userId = String(rows[0].user_id);
  const passwordHash = await hashPassword(password);
  await db`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
  await db`DELETE FROM password_resets WHERE user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
