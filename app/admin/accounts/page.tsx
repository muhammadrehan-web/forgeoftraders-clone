import { loadAdmin } from "@/lib/admin";
import { money, when } from "../format";

export const metadata = { title: "Accounts - Forge Admin" };

export default async function AccountsPage() {
  const { db } = await loadAdmin();
  const rows = await db`
    SELECT c.id, c.evaluation_type, c.account_size, c.platform, c.status, c.created_at,
      u.first_name, u.last_name,
      d.account_number, d.username, d.server
    FROM challenges c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN dashboards d ON d.challenge_id = c.id
    ORDER BY c.created_at DESC
  `;

  return (
    <>
      <h1>Accounts</h1>
      <p className="lead">Trading logins show here when an account number has been issued.</p>
      <section className="panel">
        {rows.length === 0 ? (
          <p className="empty">No trading accounts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trader</th>
                <th>Challenge</th>
                <th>Size</th>
                <th>Platform</th>
                <th>Account</th>
                <th>Username</th>
                <th>Server</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{`${row.first_name} ${row.last_name}`.trim()}</td>
                  <td>{String(row.evaluation_type)}</td>
                  <td>{money(row.account_size)}</td>
                  <td>{String(row.platform)}</td>
                  <td>{row.account_number ? String(row.account_number) : "—"}</td>
                  <td>{row.username ? String(row.username) : "—"}</td>
                  <td>{row.server ? String(row.server) : "—"}</td>
                  <td><span className="pill">{String(row.status)}</span></td>
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
