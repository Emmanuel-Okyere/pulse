"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";

type Manager = { id: string; name: string; email: string };

export function TeamPanel({
  eventId,
  canEdit,
  initialManagers,
}: {
  eventId: string;
  canEdit: boolean;
  initialManagers: Manager[];
}) {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api(`/api/events/${eventId}/managers`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setEmail("");
      router.refresh();
      // Optimistically add; a refresh will reconcile names.
      setManagers((m) =>
        m.some((x) => x.email === email.trim().toLowerCase())
          ? m
          : [...m, { id: email, name: email.trim(), email: email.trim() }]
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add manager.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(userId: string) {
    setBusy(true);
    try {
      await api(`/api/events/${eventId}/managers`, {
        method: "DELETE",
        body: JSON.stringify({ userId }),
      });
      setManagers((m) => m.filter((x) => x.id !== userId));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove manager.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6">
        <h3 className="font-heading text-base font-bold text-ink">
          Event managers
        </h3>
        <p className="text-sm text-ink-muted">
          Managers can view registrations and redeem codes on the ground, but
          cannot edit or delete the event.
        </p>

        {canEdit && (
          <form onSubmit={add} className="mt-4 flex gap-2">
            <input
              className="input"
              type="email"
              placeholder="manager@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn-primary shrink-0" disabled={busy}>
              Add
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <ul className="mt-5 divide-y divide-[var(--border)]">
          {managers.length === 0 && (
            <li className="py-4 text-sm text-ink-muted">
              No managers assigned yet.
            </li>
          )}
          {managers.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-semibold text-ink">{m.name}</div>
                <div className="text-xs text-ink-muted">{m.email}</div>
              </div>
              {canEdit && (
                <button
                  onClick={() => remove(m.id)}
                  disabled={busy}
                  className="btn-ghost text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
