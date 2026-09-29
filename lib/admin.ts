import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { ensureAppSchema } from "@/lib/schema";
import { ensureSessions, SESSION_COOKIE, userFromSession } from "@/lib/session";

export async function requireAdmin(request: Request) {
  if (!hasDatabase()) {
    return {
      db: null,
      user: null,
      error: NextResponse.json({ error: "Neon database is not configured." }, { status: 503 }),
    };
  }

  const db = sql();
  const user = await userFromSession(db, request);
  if (!user || user.role !== "admin") {
    return {
      db: null,
      user: null,
      error: NextResponse.json({ error: "Admin only." }, { status: 401 }),
    };
  }

  return { db, user, error: null };
}

export async function loadAdmin() {
  if (!hasDatabase()) redirect("/sign-in");
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value || "";
  if (!token) redirect("/sign-in");

  const db = sql();
  await ensureSessions(db);
  await ensureAppSchema(db);
  const rows = await db`
    SELECT u.id, u.first_name, u.last_name, u.role, u.blocked
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.blocked || String(row.role) !== "admin") redirect("/sign-in");

  return {
    db,
    user: {
      id: String(row.id),
      firstName: String(row.first_name || ""),
      lastName: String(row.last_name || ""),
    },
  };
}
