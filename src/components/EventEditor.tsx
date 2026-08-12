"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { FIELD_TYPES, type FieldType } from "@/lib/formSchema";

// A field as edited in the builder. `key` is derived from the label on save.
type BuilderField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  optionsText: string; // comma-separated, only for select
};

type BuilderBenefit = { id: string; label: string; detail: string };

export type EventEditorInitial = {
  id?: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string; // datetime-local value or ""
  endsAt: string;
  logoData: string | null;
  fields: BuilderField[];
  benefits: BuilderBenefit[];
  codesEnabled: boolean;
  confirmationTitle: string;
  confirmationMessage: string;
};

const rid = () => Math.random().toString(36).slice(2, 9);

export function emptyInitial(): EventEditorInitial {
  return {
    title: "",
    description: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    logoData: null,
    fields: [
      { id: rid(), label: "Full name", type: "text", required: true, optionsText: "" },
      { id: rid(), label: "Email", type: "email", required: true, optionsText: "" },
    ],
    benefits: [],
    codesEnabled: true,
    confirmationTitle: "",
    confirmationMessage: "",
  };
}

// Turn a label into a stable snake_case key.
function toKey(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `field_${index + 1}`;
}

export function EventEditor({ initial }: { initial?: EventEditorInitial }) {
  const router = useRouter();
  // Default to a blank form here, inside the client component. Computing this on
  // the server would require calling a "use client" export from a server
  // component, which hands back a client reference rather than the function.
  const [seed] = useState<EventEditorInitial>(() => initial ?? emptyInitial());
  const isEdit = Boolean(seed.id);

  const [title, setTitle] = useState(seed.title);
  const [description, setDescription] = useState(seed.description);
  const [venue, setVenue] = useState(seed.venue);
  const [startsAt, setStartsAt] = useState(seed.startsAt);
  const [endsAt, setEndsAt] = useState(seed.endsAt);
  const [logoData, setLogoData] = useState<string | null>(seed.logoData);
  const [fields, setFields] = useState<BuilderField[]>(seed.fields);
  const [benefits, setBenefits] = useState<BuilderBenefit[]>(seed.benefits);
  const [codesEnabled, setCodesEnabled] = useState(seed.codesEnabled);
  const [confirmationTitle, setConfirmationTitle] = useState(seed.confirmationTitle);
  const [confirmationMessage, setConfirmationMessage] = useState(seed.confirmationMessage);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function addField() {
    setFields((f) => [
      ...f,
      { id: rid(), label: "", type: "text", required: false, optionsText: "" },
    ]);
  }
  function updateField(id: string, patch: Partial<BuilderField>) {
    setFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  function removeField(id: string) {
    setFields((f) => f.filter((x) => x.id !== id));
  }
  function moveField(id: string, dir: -1 | 1) {
    setFields((f) => {
      const i = f.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= f.length) return f;
      const copy = [...f];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setError("Logo must be smaller than 200 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoData(reader.result as string);
    reader.readAsDataURL(file);
  }

  function buildPayload() {
    const seen = new Set<string>();
    const formSchema = fields
      .filter((f) => f.label.trim())
      .map((f, i) => {
        let key = toKey(f.label, i);
        while (seen.has(key)) key = `${key}_${i}`;
        seen.add(key);
        return {
          key,
          label: f.label.trim(),
          type: f.type,
          required: f.required,
          options:
            f.type === "select"
              ? f.optionsText
                  .split(",")
                  .map((o) => o.trim())
                  .filter(Boolean)
              : undefined,
        };
      });

    const benefitList = benefits
      .filter((b) => b.label.trim())
      .map((b) => ({ label: b.label.trim(), detail: b.detail.trim() || undefined }));

    const toIso = (v: string) => (v ? new Date(v).toISOString() : undefined);

    return {
      title: title.trim(),
      description: description.trim() || undefined,
      venue: venue.trim() || undefined,
      startsAt: toIso(startsAt),
      endsAt: toIso(endsAt),
      logoData: logoData || undefined,
      formSchema,
      benefits: benefitList,
      codesEnabled,
      // null (not undefined) so editing can clear a previously set message.
      confirmationTitle: confirmationTitle.trim() || null,
      confirmationMessage: confirmationMessage.trim() || null,
    };
  }

  async function save() {
    setError(null);
    if (title.trim().length < 3) {
      setError("Give your event a title (at least 3 characters).");
      return;
    }
    if (fields.filter((f) => f.label.trim()).length === 0) {
      setError("Add at least one field to your registration form.");
      return;
    }
    setBusy(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await api(`/api/events/${seed.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        router.push(`/dashboard/events/${seed.id}`);
      } else {
        const res = await api<{ event: { id: string } }>("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.push(`/dashboard/events/${res.event.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the event.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Basics */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-bold text-ink">Event details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                className="input mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Founders Mixer 2026"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input mt-1.5 min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell attendees what this event is about."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Venue</label>
                <input
                  className="input mt-1.5"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Accra Digital Centre"
                />
              </div>
              <div>
                <label className="label">Logo (for the QR code)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={onLogo}
                  className="mt-1.5 block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-primary"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Starts</label>
                <input
                  type="datetime-local"
                  className="input mt-1.5"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Ends</label>
                <input
                  type="datetime-local"
                  className="input mt-1.5"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form builder */}
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">
                Registration form
              </h2>
              <p className="text-sm text-ink-muted">
                Decide exactly what each attendee should tell you.
              </p>
            </div>
            <button onClick={addField} className="btn-outline">
              + Add field
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {fields.map((f, i) => (
              <div
                key={f.id}
                className="rounded-xl border border-[var(--border)] bg-neutralbg p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <div>
                    <label className="label">Question label</label>
                    <input
                      className="input mt-1.5 bg-white"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                      placeholder="e.g. School / Organization"
                    />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select
                      className="input mt-1.5 bg-white"
                      value={f.type}
                      onChange={(e) =>
                        updateField(f.id, { type: e.target.value as FieldType })
                      }
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {f.type === "select" && (
                  <div className="mt-3">
                    <label className="label">Options (comma separated)</label>
                    <input
                      className="input mt-1.5 bg-white"
                      value={f.optionsText}
                      onChange={(e) =>
                        updateField(f.id, { optionsText: e.target.value })
                      }
                      placeholder="Level 100, Level 200, Level 300"
                    />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) =>
                        updateField(f.id, { required: e.target.checked })
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    Required
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveField(f.id, -1)}
                      disabled={i === 0}
                      className="btn-ghost px-2 py-1 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveField(f.id, 1)}
                      disabled={i === fields.length - 1}
                      className="btn-ghost px-2 py-1 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeField(f.id)}
                      className="btn-ghost px-2 py-1 text-red-600 hover:bg-red-50"
                      aria-label="Remove field"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">
                Attendance benefits
              </h2>
              <p className="text-sm text-ink-muted">
                Perks attendees can redeem with their code — optional.
              </p>
            </div>
            <button
              onClick={() =>
                setBenefits((b) => [...b, { id: rid(), label: "", detail: "" }])
              }
              className="btn-outline"
            >
              + Add benefit
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {benefits.length === 0 && (
              <p className="text-sm text-ink-muted">No benefits added.</p>
            )}
            {benefits.map((b) => (
              <div
                key={b.id}
                className="grid gap-3 rounded-xl border border-[var(--border)] bg-neutralbg p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  className="input bg-white"
                  value={b.label}
                  onChange={(e) =>
                    setBenefits((list) =>
                      list.map((x) =>
                        x.id === b.id ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Free airtime"
                />
                <input
                  className="input bg-white"
                  value={b.detail}
                  onChange={(e) =>
                    setBenefits((list) =>
                      list.map((x) =>
                        x.id === b.id ? { ...x, detail: e.target.value } : x
                      )
                    )
                  }
                  placeholder="GHS 5 on any network"
                />
                <button
                  onClick={() =>
                    setBenefits((list) => list.filter((x) => x.id !== b.id))
                  }
                  className="btn-ghost text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Codes & confirmation */}
        <section className="card p-6">
          <h2 className="font-heading text-lg font-bold text-ink">
            After registration
          </h2>
          <p className="text-sm text-ink-muted">
            Control the code and the message an attendee sees once they register.
          </p>

          <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-neutralbg p-4">
            <input
              type="checkbox"
              checked={codesEnabled}
              onChange={(e) => setCodesEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">
                Issue a unique code to each attendee
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Turn this off for attendance-only events. Without codes there is
                nothing to redeem, so the Redeem tab is hidden.
              </span>
            </span>
          </label>

          <div className="mt-4">
            <label className="label">Confirmation headline</label>
            <input
              className="input mt-1.5"
              value={confirmationTitle}
              onChange={(e) => setConfirmationTitle(e.target.value)}
              maxLength={120}
              placeholder={
                codesEnabled ? "You’re checked in" : "You’re registered"
              }
            />
          </div>
          <div className="mt-4">
            <label className="label">Confirmation message</label>
            <textarea
              className="input mt-1.5 min-h-20"
              value={confirmationMessage}
              onChange={(e) => setConfirmationMessage(e.target.value)}
              maxLength={500}
              placeholder={
                codesEnabled
                  ? "Keep this code — you’ll need it to redeem your benefit."
                  : "Thanks — your attendance has been recorded."
              }
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Leave either blank to use the default shown in grey.
            </p>
          </div>
        </section>
      </div>

      {/* Sticky summary / actions */}
      <aside className="lg:col-span-1">
        <div className="card sticky top-24 p-6">
          <h3 className="font-heading text-base font-bold text-ink">Preview</h3>
          <div className="mt-3 flex items-center gap-3">
            {logoData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoData}
                alt="logo"
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary-50 font-heading text-lg font-bold text-primary">
                {(title || "E").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-heading font-bold text-ink">
                {title || "Untitled event"}
              </div>
              <div className="text-xs text-ink-muted">{venue || "No venue set"}</div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4 text-sm">
            <Row label="Form fields" value={fields.filter((f) => f.label.trim()).length} />
            <Row label="Benefits" value={benefits.filter((b) => b.label.trim()).length} />
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button onClick={save} disabled={busy} className="btn-primary mt-5 w-full">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            {isEdit
              ? "Your changes apply to the live registration page."
              : "You can publish and generate the QR code next."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
