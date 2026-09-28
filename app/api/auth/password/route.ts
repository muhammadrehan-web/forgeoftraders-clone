import { NextResponse } from "next/server";
import { hasDatabase, sql } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/mail";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email) {
    return NextResponse.json({ error: "Please enter your email" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const db = sql();
  const existing = await db`
    SELECT first_name, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Account was not found. Register again." }, { status: 404 });
  }

  const firstName = String(existing[0].first_name || "");
  const isNewAccount = !existing[0].password_hash;
  const passwordHash = await hashPassword(password);
  await db`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE email = ${email}
  `;

  let emailSent = false;
  if (isNewAccount) {
    try {
      const mail = await sendWelcomeEmail({ firstName, email });
      emailSent = mail.sent;
    } catch (error) {
      console.error("welcome email failed", error instanceof Error ? error.message : "unknown");
    }
  }

  return NextResponse.json({ ok: true, emailSent });
}
