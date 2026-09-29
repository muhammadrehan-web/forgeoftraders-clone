export function money(value: unknown) {
  return "$" + Number(value || 0).toLocaleString("en-US");
}

export function when(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function countOf(rows: Array<Record<string, unknown>>) {
  return Number(rows[0]?.count || 0);
}

export function addonsOf(value: unknown) {
  const list = Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
  return list.length ? list.join(", ") : "—";
}
