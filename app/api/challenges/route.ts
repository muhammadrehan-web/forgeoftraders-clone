import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { userFromSession } from "@/lib/session";

export const runtime = "nodejs";

function cleanText(value: unknown, max: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }
  const db = sql();
  const user = await userFromSession(db, request);
  if (!user) {
    return NextResponse.json({ error: "Sign in to see your challenges." }, { status: 401 });
  }

  const rows = await db`
    SELECT id, evaluation_type, account_size, platform, addons, fee, status, created_at
    FROM challenges
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({
    ok: true,
    takenBy: `${user.firstName} ${user.lastName}`.trim(),
    challenges: rows.map((row) => ({
      id: String(row.id),
      evaluationType: String(row.evaluation_type),
      accountSize: Number(row.account_size),
      platform: String(row.platform),
      addons: Array.isArray(row.addons) ? row.addons : [],
      fee: Number(row.fee),
      status: String(row.status),
      createdAt: row.created_at,
    })),
  });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }
  const db = sql();
  const user = await userFromSession(db, request);
  if (!user) {
    return NextResponse.json({ error: "Sign in before taking a challenge." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const evaluationType = cleanText(body?.evaluationType, 120);
  const platform = cleanText(body?.platform, 80) || "Match-Trader";
  const accountSize = Number(body?.accountSize);
  const fee = Number(body?.fee);
  const addons = Array.isArray(body?.addons)
    ? body.addons.map((item: unknown) => cleanText(item, 80)).filter(Boolean).slice(0, 8)
    : [];

  if (!evaluationType) {
    return NextResponse.json({ error: "Select a challenge first." }, { status: 400 });
  }
  if (!Number.isFinite(accountSize) || accountSize <= 0) {
    return NextResponse.json({ error: "Select an account size." }, { status: 400 });
  }

  const inserted = await db`
    INSERT INTO challenges (user_id, evaluation_type, account_size, platform, addons, fee, status)
    VALUES (
      ${user.id},
      ${evaluationType},
      ${accountSize},
      ${platform},
      ${JSON.stringify(addons)}::jsonb,
      ${Number.isFinite(fee) && fee >= 0 ? fee : 0},
      'active'
    )
    RETURNING id
  `;

  return NextResponse.json({
    ok: true,
    id: String(inserted[0].id),
    takenBy: `${user.firstName} ${user.lastName}`.trim(),
    evaluationType,
    accountSize,
  });
}
