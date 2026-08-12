"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/apiClient";

type Lookup = {
  registration: {
    code: string;
    redeemed: boolean;
    redeemedAt: string | null;
    data: Record<string, string>;
    eventId: string;
    event: { id: string; title: string; benefits: { label: string; detail?: string }[] };
  };
};

export function RedeemPanel({ eventId }: { eventId: string }) {
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<Lookup["registration"] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLookup(null);
    setBusy(true);
    try {
      const res = await api<Lookup>(`/api/registrations/${code.trim()}/redeem`);
      // Guard: the code must belong to the event we are staffing.
      if (res.registration.eventId !== eventId) {
        setError("That code belongs to a different event.");
        return;
      }
      setLookup(res.registration);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lookup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ alreadyRedeemed: boolean }>(
        `/api/registrations/${code.trim()}/redeem`,
        { method: "POST" }
      );
      setMessage(
        res.alreadyRedeemed
          ? "This code was already redeemed earlier."
          : "Redeemed. Benefit released to the attendee."
      );
      setLookup((l) => (l ? { ...l, redeemed: true } : l));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not redeem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6">
        <h3 className="font-heading text-base font-bold text-ink">
          Verify & redeem a code
        </h3>
        <p className="text-sm text-ink-muted">
          Enter the attendee’s registration code to confirm attendance and
          release their benefit.
        </p>
        <form onSubmit={find} className="mt-4 flex gap-2">
          <input
            className="input font-mono uppercase"
            placeholder="PLS-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button className="btn-primary shrink-0" disabled={busy || !code.trim()}>
            Look up
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl bg-secondary-50 px-3.5 py-2.5 text-sm text-secondary-800">
            {message}
          </div>
        )}

        {lookup && (
          <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-primary">
                {lookup.code}
              </span>
              {lookup.redeemed ? (
                <span className="chip bg-gray-100 text-gray-600">redeemed</span>
              ) : (
                <span className="chip bg-secondary-50 text-secondary-800">valid</span>
              )}
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              {Object.entries(lookup.data).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-medium text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>
            {lookup.event.benefits.length > 0 && (
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="label">Benefits</div>
                <ul className="mt-1 text-sm text-ink">
                  {lookup.event.benefits.map((b, i) => (
                    <li key={i}>◆ {b.label}</li>
                  ))}
                </ul>
              </div>
            )}
            {!lookup.redeemed && (
              <button
                onClick={redeem}
                disabled={busy}
                className="btn-primary mt-4 w-full"
              >
                Mark as redeemed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
