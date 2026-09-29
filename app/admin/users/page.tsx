import Link from "next/link";
import { loadAdmin } from "@/lib/admin";
import { countOf, when } from "../format";
import { ResetButton } from "../reset-button";
import { UserActions } from "../user-actions";

export const metadata = { title: "Users - Forge Admin" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const { db, user } = await loadAdmin();
  const like = `%${query.toLowerCase().replace(/[%_]/g, "")}%`;
  const rows = query
    ? await db`
        SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.blocked, u.created_at,
          (u.password_hash IS NOT NULL) AS has_password,
          (SELECT max(s.created_at) FROM sessions s WHERE s.user_id = u.id) AS last_login,
          (SELECT count(*)::int FROM challenges c WHERE c.user_id = u.id) AS challenge_count
        FROM users u
        WHERE lower(u.first_name || ' ' || u.last_name) LIKE ${like}
          OR lower(u.email) LIKE ${like}
        ORDER BY u.created_at DESC
      `
    : await db`
        SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.blocked, u.created_at,
          (u.password_hash IS NOT NULL) AS has_password,
          (SELECT max(s.created_at) FROM sessions s WHERE s.user_id = u.id) AS last_login,
          (SELECT count(*)::int FROM challenges c WHERE c.user_id = u.id) AS challenge_count
        FROM users u
        ORDER BY u.created_at DESC
      `;

  return (
    <>
      <h1>Users</h1>
      <section className="panel">
        <div className="panel__head">
          <h2>{rows.length} accounts</h2>
          <form className="toolbar" action="/admin/users">
            <input name="q" defaultValue={query} placeholder="Search name or email" />
            <button type="submit">Search</button>
          </form>
        </div>
        {rows.length === 0 ? (
          <p className="empty">No users match that search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Password</th>
                <th>Challenges</th>
                <th>Last login</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = String(row.id);
                const role = String(row.role || "user");
                return (
                  <tr key={id}>
                    <td><Link href={`/admin/users/${id}`}>{`${row.first_name} ${row.last_name}`.trim()}</Link></td>
                    <td>{String(row.email)}</td>
                    <td>
                      <span className={role === "admin" ? "pill" : "pill pill--user"}>{role}</span>
                      {row.blocked ? <span className="pill pill--user">blocked</span> : null}
                    </td>
                    <td>{row.has_password ? "Set" : "No password"}</td>
                    <td>{countOf([{ count: row.challenge_count }])}</td>
                    <td>{row.last_login ? when(row.last_login) : "—"}</td>
                    <td>{when(row.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <ResetButton userId={id} />
                        <UserActions userId={id} role={role} blocked={Boolean(row.blocked)} self={id === user.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
