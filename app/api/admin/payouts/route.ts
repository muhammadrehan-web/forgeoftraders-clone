import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { ensureAppSchema } from "@/lib/schema";

export const runtime = "nodejs";

const STATUSES = ["pending", "paid", "rejected"];

export async function POST(request: Request) {
  const { db, error } = await requireAdmin(request);
  if (error || !db) return error;
  await ensureAppSchema(db);

  const body = await request.json().catch(() => null);
  const userId = String(body?.userId || "");
  const amount = Number(body?.amount);
  const status = STATUSES.includes(String(body?.status)) ? String(body.status) : "pending";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "Choose a trader." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }

  const trader = await db`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;
  if (!trader[0]) return NextResponse.json({ error: "Trader was not found." }, { status: 404 });

  await db`
    INSERT INTO payouts (user_id, amount, status)
    VALUES (${userId}, ${amount}, ${status})
  `;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const { db, error } = await requireAdmin(request);
  if (error || !db) return error;
  await ensureAppSchema(db);

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  const status = String(body?.status || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Choose a payout status." }, { status: 400 });
  }
  const updated = await db`
    UPDATE payouts SET status = ${status} WHERE id = ${id} RETURNING id
  `;
  if (!updated[0]) return NextResponse.json({ error: "Payout was not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
