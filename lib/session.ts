import { randomBytes } from "crypto";
import { sql } from "@/lib/db";

export const SESSION_COOKIE = "fot_session";

type Db = ReturnType<typeof sql>;

export async function ensureRole(db: Db) {
  await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`;
  await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false`;
}

export function configuredAdminEmail() {
  return String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export async function promoteAdmin(db: Db, userId: string, email: string, role: string) {
  const configured = configuredAdminEmail();
  if (configured && email === configured && role !== "admin") {
    await db`UPDATE users SET role = 'admin' WHERE id = ${userId}`;
    return "admin";
  }
  return role === "admin" ? "admin" : "user";
}

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
  await ensureRole(db);
  const rows = await db`
    SELECT u.id, u.first_name, u.last_name, u.role, u.blocked
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.blocked) return null;
  return {
    id: String(row.id),
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    role: String(row.role || "user") === "admin" ? "admin" : "user",
  };
}
