import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* file missing */
  }
}

loadEnv(".env");
loadEnv(".env.local");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing. Run npm run db:pull first.");
  process.exit(1);
}

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`;

await sql`
  CREATE TABLE IF NOT EXISTS challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluation_type text NOT NULL,
    account_size numeric NOT NULL,
    platform text NOT NULL,
    addons jsonb NOT NULL DEFAULT '[]'::jsonb,
    fee numeric NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS sessions (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS dashboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
    account_number text NOT NULL,
    username text NOT NULL,
    server text NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    platform text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

const tables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('users', 'challenges', 'dashboards')
  ORDER BY table_name
`;

console.log(tables.map((row) => row.table_name).join("\n"));
