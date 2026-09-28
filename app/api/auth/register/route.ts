import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName || "").trim();
  const lastName = String(body?.lastName || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();

  if (!firstName) {
    return NextResponse.json({ error: "Please enter first name" }, { status: 400 });
  }
  if (!lastName) {
    return NextResponse.json({ error: "Please enter last name" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Please enter your email" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Please enter valid email address" }, { status: 400 });
  }

  const db = sql();
  try {
    const inserted = await db`
      INSERT INTO users (first_name, last_name, email, password_hash)
      VALUES (${firstName}, ${lastName}, ${email}, NULL)
      RETURNING id, email
    `;
    return NextResponse.json({ ok: true, email: inserted[0].email });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505") {
      return NextResponse.json({ error: "This email is already registered" }, { status: 409 });
    }
    console.error("register failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not save your account. Try again." }, { status: 500 });
  }
}
