import { loadAdmin } from "@/lib/admin";

export const metadata = { title: "Affiliate - Forge Admin" };

export default async function AffiliatePage() {
  await loadAdmin();

  return (
    <>
      <h1>Affiliate</h1>
      <section className="panel">
        <p className="empty">No affiliate accounts or referral totals are stored yet.</p>
      </section>
    </>
  );
}
