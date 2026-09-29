"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserActions({
  userId,
  role,
  blocked,
  self,
}: {
  userId: string;
  role: string;
  blocked: boolean;
  self: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function send(action: string, extra?: Record<string, string>) {
    setBusy(true);
    setNote("");
    fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, ...extra }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setNote(data.error || "Could not update");
          return;
        }
        if (action === "delete") {
          window.location.href = "/admin/users";
          return;
        }
        router.refresh();
      })
      .catch(() => setNote("Could not update"))
      .finally(() => setBusy(false));
  }

  if (self) return <span className="hint">Your account</span>;

  return (
    <div className="row-actions">
      <select
        className="cell-select"
        value={role === "admin" ? "admin" : "user"}
        disabled={busy}
        onChange={(event) => send("role", { role: event.target.value })}
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button className="text-action" type="button" disabled={busy} onClick={() => send(blocked ? "unblock" : "block")}>
        {blocked ? "Unblock" : "Block"}
      </button>
      <button
        className="text-action text-action--danger"
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm("Delete this account and its challenges?")) send("delete");
        }}
      >
        Delete
      </button>
      {note ? <span className="hint">{note}</span> : null}
    </div>
  );
}
