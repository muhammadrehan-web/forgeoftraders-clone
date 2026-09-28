import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  }

  const db = sql();
  const rows = await db`
    SELECT password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  const stored = rows[0]?.password_hash ? String(rows[0].password_hash) : "";
  if (!stored || !(await verifyPassword(password, stored))) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
