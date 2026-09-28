import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Run npm run db:pull.");
  }
  return neon(url);
}

export function requireDb() {
  if (!hasDatabase()) {
    return {
      db: null,
      error: NextResponse.json({ error: "Neon database is not configured." }, { status: 503 }),
    };
  }
  return { db: sql(), error: null };
}
