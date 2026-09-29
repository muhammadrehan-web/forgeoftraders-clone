import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

function userIdOf(body: { userId?: unknown }) {
  const userId = String(body?.userId || "");
  return /^[0-9a-f-]{36}$/i.test(userId) ? userId : "";
}

export async function POST(request: Request) {
  const { db, user, error } = await requireAdmin(request);
  if (error || !db || !user) return error;

  const body = await request.json().catch(() => null);
  const userId = userIdOf(body || {});
  const action = String(body?.action || "");
  if (!userId) return NextResponse.json({ error: "Choose a user." }, { status: 400 });
  if (userId === user.id) {
    return NextResponse.json({ error: "You cannot change your own account this way." }, { status: 400 });
  }

  if (action === "delete") {
    const removed = await db`DELETE FROM users WHERE id = ${userId} RETURNING id`;
    if (!removed[0]) return NextResponse.json({ error: "User was not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (action === "block" || action === "unblock") {
    const blocked = action === "block";
    const updated = await db`
      UPDATE users SET blocked = ${blocked} WHERE id = ${userId} RETURNING id
    `;
    if (!updated[0]) return NextResponse.json({ error: "User was not found." }, { status: 404 });
    if (blocked) await db`DELETE FROM sessions WHERE user_id = ${userId}`;
    return NextResponse.json({ ok: true });
  }

  if (action === "role") {
    const role = body?.role === "admin" ? "admin" : body?.role === "user" ? "user" : "";
    if (!role) return NextResponse.json({ error: "Choose a role." }, { status: 400 });
    const updated = await db`
      UPDATE users SET role = ${role} WHERE id = ${userId} RETURNING id
    `;
    if (!updated[0]) return NextResponse.json({ error: "User was not found." }, { status: 404 });
    if (role !== "admin") await db`DELETE FROM sessions WHERE user_id = ${userId}`;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
