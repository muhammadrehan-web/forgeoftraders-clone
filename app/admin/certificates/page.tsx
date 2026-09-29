import { loadAdmin } from "@/lib/admin";
import { money, when } from "../format";

export const metadata = { title: "Certificates - Forge Admin" };

export default async function CertificatesPage() {
  const { db } = await loadAdmin();
  const rows = await db`
    SELECT c.id, c.evaluation_type, c.account_size, c.created_at, u.first_name, u.last_name, u.email
    FROM challenges c
    JOIN users u ON u.id = c.user_id
    WHERE c.status = 'passed'
    ORDER BY c.created_at DESC
  `;

  return (
    <>
      <h1>Certificates</h1>
      <p className="lead">A certificate row appears when a challenge is marked passed.</p>
      <section className="panel">
        {rows.length === 0 ? (
          <p className="empty">No passed challenges yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trader</th>
                <th>Email</th>
                <th>Challenge</th>
                <th>Size</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{`${row.first_name} ${row.last_name}`.trim()}</td>
                  <td>{String(row.email)}</td>
                  <td>{String(row.evaluation_type)}</td>
                  <td>{money(row.account_size)}</td>
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
