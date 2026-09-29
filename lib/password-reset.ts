import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";
import { sql } from "@/lib/db";
import { ensureSessions } from "@/lib/session";

type Db = ReturnType<typeof sql>;

async function ensureResets(db: Db) {
  await db`
    CREATE TABLE IF NOT EXISTS password_resets (
      token text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function beginPasswordReset(
  db: Db,
  user: { id: string; firstName: string; email: string }
) {
  const token = randomBytes(32).toString("hex");
  await ensureResets(db);
  await db`DELETE FROM password_resets WHERE user_id = ${user.id}`;
  await db`
    INSERT INTO password_resets (token, user_id, expires_at)
    VALUES (${token}, ${user.id}, now() + interval '1 hour')
  `;

  try {
    await sendPasswordResetEmail({
      firstName: user.firstName,
      email: user.email,
      token,
    });
  } catch (error) {
    await db`DELETE FROM password_resets WHERE token = ${token}`;
    console.error("password reset email failed", error instanceof Error ? error.message : "unknown");
    return { ok: false as const };
  }

  await db`UPDATE users SET password_hash = NULL WHERE id = ${user.id}`;
  await ensureSessions(db);
  await db`DELETE FROM sessions WHERE user_id = ${user.id}`;
  return { ok: true as const };
}
