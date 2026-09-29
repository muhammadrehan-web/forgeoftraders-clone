import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { beginPasswordReset } from "@/lib/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requireAdmin(request);
  if (gate.error || !gate.db) return gate.error;

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId || "").trim();
  if (!userId) {
    return NextResponse.json({ error: "Choose a user." }, { status: 400 });
  }

  const rows = await gate.db`
    SELECT id, first_name, email
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;
  if (!rows.length) {
    return NextResponse.json({ error: "User was not found." }, { status: 404 });
  }

  const result = await beginPasswordReset(gate.db, {
    id: String(rows[0].id),
    firstName: String(rows[0].first_name || ""),
    email: String(rows[0].email || ""),
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Could not send the reset email. Try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
