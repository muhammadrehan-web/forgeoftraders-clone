"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayoutForm({ users }: { users: Array<{ id: string; label: string }> }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const dataForm = new FormData(form);
        setBusy(true);
        setNote("");
        fetch("/api/admin/payouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: String(dataForm.get("userId") || ""),
            amount: Number(dataForm.get("amount")),
            status: String(dataForm.get("status") || "pending"),
          }),
        })
          .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              setNote(data.error || "Could not save");
              return;
            }
            setNote("Saved");
            form.reset();
            router.refresh();
          })
          .catch(() => setNote("Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <select className="cell-select" name="userId" required defaultValue="">
        <option value="" disabled>Trader</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>{user.label}</option>
        ))}
      </select>
      <input className="cell-input" name="amount" inputMode="decimal" placeholder="Amount" required />
      <select className="cell-select" name="status" defaultValue="pending">
        <option value="pending">pending</option>
        <option value="paid">paid</option>
        <option value="rejected">rejected</option>
      </select>
      <button type="submit" disabled={busy}>{busy ? "Saving" : "Add payout"}</button>
      {note ? <span className="hint">{note}</span> : null}
    </form>
  );
}

export function PayoutStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);

  return (
    <select
      className="cell-select"
      value={value}
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        fetch("/api/admin/payouts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: next }),
        }).then(() => router.refresh());
      }}
    >
      <option value="pending">pending</option>
      <option value="paid">paid</option>
      <option value="rejected">rejected</option>
    </select>
  );
}
