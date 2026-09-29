import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { ensureSessions, readSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = readSessionToken(request);
  if (token && hasDatabase()) {
    const db = sql();
    await ensureSessions(db);
    await db`DELETE FROM sessions WHERE token = ${token}`;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
