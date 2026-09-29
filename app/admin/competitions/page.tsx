import { loadAdmin } from "@/lib/admin";

export const metadata = { title: "Competitions - Forge Admin" };

export default async function CompetitionsPage() {
  await loadAdmin();

  return (
    <>
      <h1>Competitions</h1>
      <section className="panel">
        <p className="empty">No competition entries are stored yet. The trader competitions page is still the public listing.</p>
      </section>
    </>
  );
}
