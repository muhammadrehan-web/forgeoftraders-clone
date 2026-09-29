import { loadAdmin } from "@/lib/admin";
import { PriceEditor } from "../price-editor";

export const metadata = { title: "Pricing - Forge Admin" };

export default async function PricingPage() {
  const { db } = await loadAdmin();
  const rows = await db`
    SELECT id, challenge_name, account_size, price, leverage
    FROM challenge_prices
    ORDER BY challenge_name, account_size
  `;

  return (
    <>
      <h1>Pricing</h1>
      <p className="lead">Edit a price and save it. The next challenge a trader takes uses this price.</p>
      <section className="panel">
        {rows.length === 0 ? (
          <p className="empty">No prices yet.</p>
        ) : (
          <PriceEditor
            rows={rows.map((row) => ({
              id: String(row.id),
              name: String(row.challenge_name),
              size: Number(row.account_size),
              price: Number(row.price),
              leverage: String(row.leverage || "1:30"),
            }))}
          />
        )}
      </section>
    </>
  );
}
