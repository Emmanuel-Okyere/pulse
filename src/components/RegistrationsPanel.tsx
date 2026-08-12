"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { FormField } from "@/lib/formSchema";

type Registration = {
  id: string;
  code: string | null;
  data: Record<string, string>;
  redeemed: boolean;
  createdAt: string;
};

export function RegistrationsPanel({
  eventId,
  fields,
}: {
  eventId: string;
  fields: FormField[];
}) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api<{ registrations: Registration[] }>(`/api/events/${eventId}/registrations`)
      .then((r) => setRows(r.registrations))
      .finally(() => setLoading(false));
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.code?.toLowerCase().includes(q) ?? false) ||
        Object.values(r.data).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  function exportCsv() {
    const headers = ["code", "registered_at", "redeemed", ...fields.map((f) => f.label)];
    const lines = filtered.map((r) =>
      [
        r.code ?? "",
        new Date(r.createdAt).toISOString(),
        r.redeemed ? "yes" : "no",
        ...fields.map((f) => csvCell(r.data[f.key] ?? "")),
      ].join(",")
    );
    const csv = [headers.map(csvCell).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="card h-40 animate-pulse bg-gray-100" />;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-4">
        <div>
          <h3 className="font-heading text-base font-bold text-ink">
            Registrations
          </h3>
          <p className="text-sm text-ink-muted">
            {rows.length} attendee{rows.length === 1 ? "" : "s"} registered.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="input w-52"
            placeholder="Search code or answer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="btn-outline shrink-0"
          >
            Export CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-ink-muted">
          {rows.length === 0
            ? "No registrations yet."
            : "No registrations match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-4 py-3 font-mono text-xs uppercase text-ink-muted">
                  Code
                </th>
                {fields.map((f) => (
                  <th
                    key={f.key}
                    className="px-4 py-3 font-mono text-xs uppercase text-ink-muted"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-mono text-xs uppercase text-ink-muted">
                  Redeemed
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-ink-muted">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-neutralbg"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {r.code ?? <span className="text-gray-300">—</span>}
                  </td>
                  {fields.map((f) => (
                    <td key={f.key} className="px-4 py-3 text-ink">
                      {r.data[f.key] || <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {r.redeemed ? (
                      <span className="chip bg-secondary-50 text-secondary-800">
                        yes
                      </span>
                    ) : (
                      <span className="chip bg-gray-100 text-gray-500">no</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Escape a value for CSV output.
function csvCell(value: string): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
