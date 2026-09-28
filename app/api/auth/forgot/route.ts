import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";
import { ensureSessions } from "@/lib/session";

export const runtime = "nodejs";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function ensureResets(db: ReturnType<typeof sql>) {
  await db`
    CREATE TABLE IF NOT EXISTS password_resets (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
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
    SELECT id, first_name
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  if (!rows.length) {
    return NextResponse.json({ ok: true });
  }

  const userId = String(rows[0].id);
  const firstName = String(rows[0].first_name || "");
  const token = randomBytes(32).toString("hex");
  await ensureResets(db);
  await db`DELETE FROM password_resets WHERE user_id = ${userId}`;
  await db`
    INSERT INTO password_resets (token, user_id, expires_at)
    VALUES (${token}, ${userId}, now() + interval '1 hour')
  `;

  try {
    await sendPasswordResetEmail({ firstName, email, token });
  } catch (error) {
    await db`DELETE FROM password_resets WHERE token = ${token}`;
    console.error("password reset email failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not send the reset email. Try again." }, { status: 502 });
  }

  await db`UPDATE users SET password_hash = NULL WHERE id = ${userId}`;
  await ensureSessions(db);
  await db`DELETE FROM sessions WHERE user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}
