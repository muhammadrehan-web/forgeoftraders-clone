import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAdmin } from "@/lib/admin";
import { FeeEditor, StatusSelect } from "../../challenge-controls";
import { addonsOf, money, when } from "../../format";
import { ResetButton } from "../../reset-button";
import { UserActions } from "../../user-actions";

export const metadata = { title: "User - Forge Admin" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, user } = await loadAdmin();
  const rows = await db`
    SELECT id, first_name, last_name, email, role, blocked, created_at,
      (password_hash IS NOT NULL) AS has_password,
      (SELECT max(created_at) FROM sessions s WHERE s.user_id = users.id) AS last_login
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;
  const account = rows[0];
  if (!account) notFound();

  const challenges = await db`
    SELECT id, evaluation_type, account_size, platform, addons, fee, status, created_at
    FROM challenges
    WHERE user_id = ${id}
    ORDER BY created_at DESC
  `;
  const role = String(account.role || "user");
  const name = `${account.first_name} ${account.last_name}`.trim();

  return (
    <>
      <Link className="back" href="/admin/users">All users</Link>
      <h1>{name}</h1>
      <p className="lead">
        {String(account.email)} · {role} · {account.has_password ? "Password set" : "No password"} · Last login {account.last_login ? when(account.last_login) : "never"}
      </p>
      <div className="row-actions" style={{ marginBottom: 18 }}>
        <ResetButton userId={id} />
        <UserActions userId={id} role={role} blocked={Boolean(account.blocked)} self={id === user.id} />
      </div>
      <section className="panel">
        <div className="panel__head">
          <h2>{challenges.length} challenges</h2>
        </div>
        {challenges.length === 0 ? (
          <p className="empty">This trader has not taken a challenge.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Challenge</th>
                <th>Size</th>
                <th>Platform</th>
                <th>Add-ons</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((row) => (
                <tr key={String(row.id)}>
                  <td>{String(row.evaluation_type)}</td>
                  <td>{money(row.account_size)}</td>
                  <td>{String(row.platform)}</td>
                  <td>{addonsOf(row.addons)}</td>
                  <td><FeeEditor id={String(row.id)} fee={Number(row.fee)} /></td>
                  <td><StatusSelect id={String(row.id)} status={String(row.status)} /></td>
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
