import { loadAdmin } from "@/lib/admin";
import { money, when } from "../format";
import { PayoutForm, PayoutStatus } from "../payout-form";

export const metadata = { title: "Payouts - Forge Admin" };

export default async function PayoutsPage() {
  const { db } = await loadAdmin();
  const [users, payouts] = await Promise.all([
    db`SELECT id, first_name, last_name, email FROM users ORDER BY first_name, last_name`,
    db`
      SELECT p.id, p.amount, p.status, p.created_at, u.first_name, u.last_name, u.email
      FROM payouts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `,
  ]);

  return (
    <>
      <h1>Payouts</h1>
      <p className="lead">Record a trader payout and mark it paid or rejected.</p>
      <section className="panel">
        <PayoutForm
          users={users.map((row) => ({
            id: String(row.id),
            label: `${row.first_name} ${row.last_name}`.trim() + ` · ${row.email}`,
          }))}
        />
        {payouts.length === 0 ? (
          <p className="empty">No payouts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trader</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((row) => (
                <tr key={String(row.id)}>
                  <td>{`${row.first_name} ${row.last_name}`.trim()}</td>
                  <td>{String(row.email)}</td>
                  <td>{money(row.amount)}</td>
                  <td><PayoutStatus id={String(row.id)} status={String(row.status)} /></td>
                  <td>{when(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
