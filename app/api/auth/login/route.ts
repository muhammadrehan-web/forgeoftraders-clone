import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, ensureRole, promoteAdmin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

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
  await ensureRole(db);
  const rows = await db`
    SELECT id, password_hash, role, blocked
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  const stored = rows[0]?.password_hash ? String(rows[0].password_hash) : "";
  if (!stored || !(await verifyPassword(password, stored))) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  if (rows[0].blocked) {
    return NextResponse.json({ error: "This account is blocked." }, { status: 403 });
  }

  const userId = String(rows[0].id);
  const role = await promoteAdmin(db, userId, email, String(rows[0].role || "user"));
  const token = await createSession(db, userId);
  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
