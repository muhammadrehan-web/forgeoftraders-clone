import { randomBytes } from "crypto";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "fot_session";

type Db = ReturnType<typeof sql>;

export async function ensureSessions(db: Db) {
  await db`
    CREATE TABLE IF NOT EXISTS sessions (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export function readSessionToken(request: Request) {
  const header = request.headers.get("cookie") || "";
  const parts = header.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
}

export async function createSession(db: Db, userId: string) {
  await ensureSessions(db);
  const token = randomBytes(32).toString("hex");
  await db`INSERT INTO sessions (token, user_id) VALUES (${token}, ${userId})`;
  return token;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function userFromSession(db: Db, request: Request) {
  const token = readSessionToken(request);
  if (!token) return null;
  await ensureSessions(db);
  const rows = await db`
    SELECT u.id, u.first_name, u.last_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
  };
}
