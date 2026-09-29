import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { ensureAppSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }
  const db = sql();
  await ensureAppSchema(db);
  const rows = await db`
    SELECT challenge_key, challenge_name, account_size, price, leverage
    FROM challenge_prices
    ORDER BY challenge_name, account_size
  `;

  const challenges: Array<{
    id: string;
    name: string;
    balances: Array<{ size: number; price: number; leverage: string }>;
  }> = [];

  for (const row of rows) {
    const id = String(row.challenge_key);
    let group = challenges.find((item) => item.id === id);
    if (!group) {
      group = { id, name: String(row.challenge_name), balances: [] };
      challenges.push(group);
    }
    group.balances.push({
      size: Number(row.account_size),
      price: Number(row.price),
      leverage: String(row.leverage || "1:30"),
    });
  }

  return NextResponse.json({ ok: true, challenges });
}
