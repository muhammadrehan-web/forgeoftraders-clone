"use client";

import { useState } from "react";

export function ResetButton({ userId }: { userId: string }) {
  const [label, setLabel] = useState("Reset password");
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-action"
      type="button"
      disabled={busy}
      onClick={() => {
        if (!window.confirm("Clear this password and email a reset link?")) return;
        setBusy(true);
        fetch("/api/admin/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
          .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            setLabel(response.ok ? "Email sent" : data.error || "Could not send");
          })
          .catch(() => setLabel("Could not send"))
          .finally(() => setBusy(false));
      }}
    >
      {label}
    </button>
  );
}
