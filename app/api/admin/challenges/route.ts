import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const STATUSES = ["active", "passed", "failed", "cancelled"];

export async function PATCH(request: Request) {
  const { db, error } = await requireAdmin(request);
  if (error || !db) return error;

  const body = await request.json().catch(() => null);
  const id = String(body?.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Choose a challenge." }, { status: 400 });
  }

  const hasStatus = body?.status != null;
  const hasFee = body?.fee != null;
  const status = hasStatus ? String(body.status) : "";
  const fee = hasFee ? Number(body.fee) : null;
  if (hasStatus && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }
  if (hasFee && (fee == null || !Number.isFinite(fee) || fee < 0 || fee > 1000000)) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }
  if (!hasStatus && !hasFee) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = hasStatus && hasFee
    ? await db`UPDATE challenges SET status = ${status}, fee = ${fee} WHERE id = ${id} RETURNING id`
    : hasStatus
      ? await db`UPDATE challenges SET status = ${status} WHERE id = ${id} RETURNING id`
      : await db`UPDATE challenges SET fee = ${fee} WHERE id = ${id} RETURNING id`;

  if (!updated[0]) return NextResponse.json({ error: "Challenge was not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
