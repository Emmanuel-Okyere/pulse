"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/apiClient";

type Analytics = {
  totals: {
    scans: number;
    registrations: number;
    redeemed: number;
    conversion: number;
    redemptionRate: number;
  };
  series: { day: string; scans: number; registrations: number }[];
};

export function AnalyticsPanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Analytics>(`/api/events/${eventId}/analytics`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-sm text-ink-muted">No analytics yet.</p>;

  const { totals, series } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Scans" value={totals.scans} />
        <Metric label="Registrations" value={totals.registrations} />
        <Metric label="Redeemed" value={totals.redeemed} />
        <Metric label="Conversion" value={`${totals.conversion}%`} accent />
        <Metric label="Redemption" value={`${totals.redemptionRate}%`} accent />
      </div>

      <div className="card p-6">
        <h3 className="font-heading text-base font-bold text-ink">
          Scans vs registrations over time
        </h3>
        {series.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-muted">
            No activity recorded yet. Share your QR code to get started.
          </p>
        ) : (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5D3FD3" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5D3FD3" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C4CC" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00C4CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#5D3FD3"
                  fill="url(#gScan)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#00C4CC"
                  fill="url(#gReg)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex gap-6 text-xs text-ink-muted">
          <Legend color="#5D3FD3" label="Scans" />
          <Legend color="#00C4CC" label="Registrations" />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div
        className={`font-heading text-3xl font-extrabold tracking-tight ${
          accent ? "text-primary" : "text-ink"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-gray-100" />
      ))}
    </div>
  );
}
