"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { QrPoster } from "@/components/QrPoster";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { RegistrationsPanel } from "@/components/RegistrationsPanel";
import { RedeemPanel } from "@/components/RedeemPanel";
import { TeamPanel } from "@/components/TeamPanel";
import type { FormField, Benefit } from "@/lib/formSchema";

type EventData = {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  logoData: string | null;
  organizerName: string;
  codesEnabled: boolean;
  embedLogoInQr: boolean;
  fields: FormField[];
  benefits: Benefit[];
  managers: { id: string; name: string; email: string }[];
};

type Tab = "overview" | "analytics" | "registrations" | "redeem" | "team";

// Redeem only makes sense when the event issues codes.
function tabsFor(codesEnabled: boolean): { id: Tab; label: string }[] {
  const all: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "registrations", label: "Registrations" },
    { id: "redeem", label: "Redeem" },
    { id: "team", label: "Team" },
  ];
  return codesEnabled ? all : all.filter((t) => t.id !== "redeem");
}

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-secondary-50 text-secondary-800",
  CLOSED: "bg-primary-50 text-primary-700",
};

export function EventWorkspace({
  event,
  registrationUrl,
  canEdit,
}: {
  event: EventData;
  registrationUrl: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState(event.status);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function setEventStatus(next: EventData["status"]) {
    setBusy(true);
    try {
      await api(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this event and all its registrations? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    try {
      await api(`/api/events/${event.id}`, { method: "DELETE" });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete event.");
      setBusy(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {event.logoData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.logoData}
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary-50 font-heading text-2xl font-bold text-primary">
              {event.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
                {event.title}
              </h1>
              <span className={`chip ${statusStyles[status]}`}>
                {status.toLowerCase()}
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              {event.venue || "No venue"} · by {event.organizerName}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {status === "DRAFT" && (
              <button
                onClick={() => setEventStatus("PUBLISHED")}
                disabled={busy}
                className="btn-primary"
              >
                Publish & open registration
              </button>
            )}
            {status === "PUBLISHED" && (
              <button
                onClick={() => setEventStatus("CLOSED")}
                disabled={busy}
                className="btn-secondary"
              >
                Close registration
              </button>
            )}
            {status === "CLOSED" && (
              <button
                onClick={() => setEventStatus("PUBLISHED")}
                disabled={busy}
                className="btn-outline"
              >
                Re-open
              </button>
            )}
            <Link href={`/dashboard/events/${event.id}/edit`} className="btn-outline">
              Edit
            </Link>
            <button
              onClick={remove}
              disabled={busy}
              className="btn-ghost text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {tabsFor(event.codesEnabled).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && (
          <Overview
            event={event}
            status={status}
            registrationUrl={registrationUrl}
            copied={copied}
            copyLink={copyLink}
          />
        )}
        {tab === "analytics" && <AnalyticsPanel eventId={event.id} />}
        {tab === "registrations" && (
          <RegistrationsPanel eventId={event.id} fields={event.fields} />
        )}
        {tab === "redeem" && <RedeemPanel eventId={event.id} />}
        {tab === "team" && (
          <TeamPanel
            eventId={event.id}
            canEdit={canEdit}
            initialManagers={event.managers}
          />
        )}
      </div>
    </div>
  );
}

function Overview({
  event,
  status,
  registrationUrl,
  copied,
  copyLink,
}: {
  event: EventData;
  status: string;
  registrationUrl: string;
  copied: boolean;
  copyLink: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* QR + link */}
      <div className="card p-6 lg:col-span-1">
        <h3 className="font-heading text-base font-bold text-ink">
          Registration QR
        </h3>
        <p className="mb-4 text-sm text-ink-muted">
          Print this and place it at your entrance. Each scan opens the form.
        </p>
        {status === "DRAFT" ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Publish the event to activate this QR code for attendees.
          </div>
        ) : null}
        <div className={status === "DRAFT" ? "mt-4 opacity-60" : "mt-4"}>
          <QrPoster
            url={registrationUrl}
            logoData={event.logoData}
            title={event.title}
            embedLogo={event.embedLogoInQr}
          />
        </div>
        <div className="mt-4">
          <label className="label">Registration link</label>
          <div className="mt-1.5 flex gap-2">
            <input
              readOnly
              value={registrationUrl}
              className="input font-mono text-xs"
            />
            <button onClick={copyLink} className="btn-outline shrink-0">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Form + benefits summary */}
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-6">
          <h3 className="font-heading text-base font-bold text-ink">
            Registration form
          </h3>
          <p className="text-sm text-ink-muted">
            {event.fields.length} field{event.fields.length === 1 ? "" : "s"}{" "}
            collected from each attendee.
          </p>
          <div className="mt-4 divide-y divide-[var(--border)]">
            {event.fields.map((f) => (
              <div key={f.key} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-ink">{f.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-ink-muted">
                    {f.type}
                  </span>
                  {f.required && (
                    <span className="chip bg-primary-50 text-primary-700">
                      required
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-heading text-base font-bold text-ink">Benefits</h3>
          {event.benefits.length === 0 ? (
            <p className="mt-1 text-sm text-ink-muted">
              No benefits configured for this event.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {event.benefits.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl bg-neutralbg px-4 py-3"
                >
                  <span className="mt-0.5 text-secondary-700">◆</span>
                  <div>
                    <div className="font-semibold text-ink">{b.label}</div>
                    {b.detail && (
                      <div className="text-sm text-ink-muted">{b.detail}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
