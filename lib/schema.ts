import { DEFAULT_PRICES } from "@/lib/default-prices";
import { sql } from "@/lib/db";
import { ensureRole } from "@/lib/session";

type Db = ReturnType<typeof sql>;

let ready = false;

export async function ensureAppSchema(db: Db) {
  await ensureRole(db);
  if (ready) return;

  await db`
    CREATE TABLE IF NOT EXISTS challenge_prices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_key text NOT NULL,
      challenge_name text NOT NULL,
      account_size numeric NOT NULL,
      price numeric NOT NULL,
      leverage text NOT NULL DEFAULT '1:30',
      UNIQUE (challenge_key, account_size)
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS payouts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount numeric NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const count = await db`SELECT count(*)::int AS count FROM challenge_prices`;
  if (Number(count[0]?.count || 0) === 0) {
    const rows = DEFAULT_PRICES.flatMap((item) =>
      item.balances.map((balance) => ({
        challenge_key: item.id,
        challenge_name: item.name,
        account_size: balance.size,
        price: balance.price,
        leverage: balance.leverage,
      })),
    );
    await db`
      INSERT INTO challenge_prices (challenge_key, challenge_name, account_size, price, leverage)
      SELECT challenge_key, challenge_name, account_size, price, leverage
      FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
        AS x(challenge_key text, challenge_name text, account_size numeric, price numeric, leverage text)
      ON CONFLICT (challenge_key, account_size) DO NOTHING
    `;
  }

  ready = true;
}

export async function catalogFee(db: Db, evaluationType: string, accountSize: number) {
  await ensureAppSchema(db);
  const rows = await db`
    SELECT price
    FROM challenge_prices
    WHERE lower(challenge_name) = ${evaluationType.toLowerCase()}
      AND account_size = ${accountSize}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const price = Number(rows[0].price);
  return Number.isFinite(price) ? price : null;
}
