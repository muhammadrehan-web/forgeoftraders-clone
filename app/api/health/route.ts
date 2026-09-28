import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";

export async function GET() {
  if (!hasDatabase()) {
    return NextResponse.json({ ok: false, db: "missing" }, { status: 503 });
  }
  try {
    const rows = await sql()`SELECT 1 AS ok`;
    return NextResponse.json({
      ok: Boolean(rows[0]),
      db: "neon",
      branch: process.env.NEON_BRANCH ?? "unknown",
    });
  } catch {
    return NextResponse.json({ ok: false, db: "error" }, { status: 500 });
  }
}
