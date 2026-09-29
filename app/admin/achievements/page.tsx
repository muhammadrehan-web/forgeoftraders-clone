import { loadAdmin } from "@/lib/admin";

export const metadata = { title: "Achievements - Forge Admin" };

export default async function AchievementsPage() {
  const { db } = await loadAdmin();
  const rows = await db`
    SELECT u.id, u.first_name, u.last_name, u.email,
      count(*) FILTER (WHERE c.status = 'passed')::int AS passed,
      count(c.id)::int AS taken
    FROM users u
    LEFT JOIN challenges c ON c.user_id = u.id
    GROUP BY u.id
    ORDER BY passed DESC, taken DESC, u.first_name
  `;

  return (
    <>
      <h1>Achievements</h1>
      <p className="lead">Passed challenges are the achievement count for each trader.</p>
      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Trader</th>
              <th>Email</th>
              <th>Taken</th>
              <th>Passed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td>{`${row.first_name} ${row.last_name}`.trim()}</td>
                <td>{String(row.email)}</td>
                <td>{Number(row.taken || 0)}</td>
                <td>{Number(row.passed || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
