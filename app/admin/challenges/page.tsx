import Link from "next/link";
import { loadAdmin } from "@/lib/admin";
import { FeeEditor, StatusSelect } from "../challenge-controls";
import { addonsOf, money, when } from "../format";

export const metadata = { title: "Challenges - Forge Admin" };

const FILTERS = ["all", "active", "passed", "failed", "cancelled"];

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const filter = FILTERS.includes(status) ? status : "all";
  const { db } = await loadAdmin();
  const rows = filter === "all"
    ? await db`
        SELECT c.id, c.evaluation_type, c.account_size, c.platform, c.addons, c.fee, c.status, c.created_at,
          u.first_name, u.last_name
        FROM challenges c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.created_at DESC
      `
    : await db`
        SELECT c.id, c.evaluation_type, c.account_size, c.platform, c.addons, c.fee, c.status, c.created_at,
          u.first_name, u.last_name
        FROM challenges c
        JOIN users u ON u.id = c.user_id
        WHERE c.status = ${filter}
        ORDER BY c.created_at DESC
      `;

  return (
    <>
      <h1>Challenges</h1>
      <section className="panel">
        <div className="panel__head">
          <h2>Who took which challenge</h2>
          <div className="filters">
            {FILTERS.map((item) => (
              <Link
                key={item}
                href={item === "all" ? "/admin/challenges" : `/admin/challenges?status=${item}`}
                aria-current={filter === item ? "page" : undefined}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="empty">No challenges found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trader</th>
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
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <td>{`${row.first_name} ${row.last_name}`.trim()}</td>
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
