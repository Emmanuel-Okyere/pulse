"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { FormField } from "@/lib/formSchema";

type Registration = {
  id: string;
  codeMasked: string | null;
  data: Record<string, string>;
  redeemed: boolean;
  redeemedAt: string | null;
  redeemCount: number;
  createdAt: string;
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : "";

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
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api<{ registrations: Registration[] }>(`/api/events/${eventId}/registrations`)
      .then((r) => setRows(r.registrations))
      .finally(() => setLoading(false));
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    // The full code is not available client-side, so search matches the masked
    // code and the submitted answers.
    return rows.filter(
      (r) =>
        (r.codeMasked?.toLowerCase().includes(q) ?? false) ||
        Object.values(r.data).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, query]);

  // A single table shape shared by the CSV and Excel exporters.
  function buildRows() {
    const headers = [
      "code",
      "registered_at",
      "redeemed",
      "redeem_count",
      "redeemed_at",
      ...fields.map((f) => f.label),
    ];
    const data = filtered.map((r) => [
      r.codeMasked ?? "",
      fmt(r.createdAt),
      r.redeemed ? "yes" : "no",
      String(r.redeemCount),
      fmt(r.redeemedAt),
      ...fields.map((f) => r.data[f.key] ?? ""),
    ]);
    return { headers, data };
  }

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const { headers, data } = buildRows();
    const csv = [headers, ...data]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    download(new Blob([csv], { type: "text/csv" }), "registrations.csv");
  }

  async function exportExcel() {
    setExporting(true);
    try {
      // Load the (sizeable) library only when actually exporting.
      const XLSX = await import("xlsx");
      const { headers, data } = buildRows();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      ws["!cols"] = headers.map((h, i) => ({
        wch: Math.min(
          40,
          Math.max(h.length, ...data.map((r) => String(r[i] ?? "").length)) + 2
        ),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Registrations");
      XLSX.writeFile(wb, "registrations.xlsx");
    } finally {
      setExporting(false);
    }
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
        <div className="flex flex-wrap gap-2">
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
            CSV
          </button>
          <button
            onClick={exportExcel}
            disabled={filtered.length === 0 || exporting}
            className="btn-outline shrink-0"
          >
            {exporting ? "Exporting…" : "Excel"}
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
                  Registered
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase text-ink-muted">
                  Redeemed
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-neutralbg"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {r.codeMasked ?? <span className="text-gray-300">—</span>}
                  </td>
                  {fields.map((f) => (
                    <td key={f.key} className="px-4 py-3 text-ink">
                      {r.data[f.key] || <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-muted">
                    {fmt(r.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {r.redeemed ? (
                      <span className="text-secondary-800">
                        {fmt(r.redeemedAt)}
                        {r.redeemCount > 1 && (
                          <span className="ml-1 font-semibold">×{r.redeemCount}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">not yet</span>
                    )}
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
