"use client";

import { useState } from "react";

type PriceRow = {
  id: string;
  name: string;
  size: number;
  price: number;
  leverage: string;
};

export function PriceEditor({ rows }: { rows: PriceRow[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((row) => [row.id, String(row.price)])),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const names = [...new Set(rows.map((row) => row.name))];

  function save(id: string) {
    setBusy(id);
    fetch("/api/admin/prices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, price: Number(values[id]) }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        setNotes((current) => ({ ...current, [id]: response.ok ? "Saved" : data.error || "Could not save" }));
      })
      .catch(() => setNotes((current) => ({ ...current, [id]: "Could not save" })))
      .finally(() => setBusy(""));
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Account size</th>
          <th>Leverage</th>
          <th>Price</th>
          <th></th>
        </tr>
      </thead>
      {names.map((name) => (
        <tbody key={name}>
          <tr className="group-label">
            <td colSpan={4}>{name}</td>
          </tr>
          {rows.filter((row) => row.name === name).map((row) => (
            <tr key={row.id}>
              <td>${Number(row.size).toLocaleString("en-US")}</td>
              <td>{row.leverage}</td>
              <td>
                <input
                  className="cell-input"
                  inputMode="decimal"
                  value={values[row.id] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [row.id]: event.target.value }))}
                />
              </td>
              <td className="row-actions">
                <button className="text-action" type="button" disabled={busy === row.id} onClick={() => save(row.id)}>
                  {busy === row.id ? "Saving" : "Save"}
                </button>
                {notes[row.id] ? <span className="hint">{notes[row.id]}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
