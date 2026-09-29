import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { ensureAppSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const { db, error } = await requireAdmin(request);
  if (error || !db) return error;

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  const price = Number(body?.price);
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Choose a price." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0 || price > 1000000) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  await ensureAppSchema(db);
  const updated = await db`
    UPDATE challenge_prices
    SET price = ${price}
    WHERE id = ${id}
    RETURNING id
  `;
  if (!updated[0]) {
    return NextResponse.json({ error: "Price was not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
