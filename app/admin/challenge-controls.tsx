"use client";

import { useState } from "react";

const STATUSES = ["active", "passed", "failed", "cancelled"];

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const [value, setValue] = useState(STATUSES.includes(status) ? status : "active");
  const [note, setNote] = useState("");

  return (
    <span className="row-actions">
      <select
        className="cell-select"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          setNote("");
          fetch("/api/admin/challenges", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: next }),
          })
            .then(async (response) => {
              const data = await response.json().catch(() => ({}));
              setNote(response.ok ? "Saved" : data.error || "Could not save");
            })
            .catch(() => setNote("Could not save"));
        }}
      >
        {STATUSES.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      {note ? <span className="hint">{note}</span> : null}
    </span>
  );
}

export function FeeEditor({ id, fee }: { id: string; fee: number }) {
  const [value, setValue] = useState(String(fee));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <span className="row-actions">
      <input className="cell-input" inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value)} />
      <button
        className="text-action"
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setNote("");
          fetch("/api/admin/challenges", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, fee: Number(value) }),
          })
            .then(async (response) => {
              const data = await response.json().catch(() => ({}));
              setNote(response.ok ? "Saved" : data.error || "Could not save");
            })
            .catch(() => setNote("Could not save"))
            .finally(() => setBusy(false));
        }}
      >
        Save
      </button>
      {note ? <span className="hint">{note}</span> : null}
    </span>
  );
}
