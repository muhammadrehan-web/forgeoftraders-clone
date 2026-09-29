import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { beginPasswordReset } from "@/lib/password-reset";

export const runtime = "nodejs";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  const db = sql();
  const rows = await db`
    SELECT id, first_name, email
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  if (!rows.length) {
    return NextResponse.json({ ok: true });
  }

  const result = await beginPasswordReset(db, {
    id: String(rows[0].id),
    firstName: String(rows[0].first_name || ""),
    email: String(rows[0].email || email),
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Could not send the reset email. Try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
