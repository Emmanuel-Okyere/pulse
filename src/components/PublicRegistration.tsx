"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import type { FormField, Benefit } from "@/lib/formSchema";
import { PhoneField } from "@/components/PhoneField";

type Props = {
  slug: string;
  title: string;
  description: string | null;
  venue: string | null;
  startsAt: string | null;
  logoData: string | null;
  fields: FormField[];
  benefits: Benefit[];
  themePrimary: string | null;
  themeAccent: string | null;
};

type RegisterResult = {
  code: string | null;
  codesEnabled: boolean;
  confirmationTitle: string | null;
  confirmationMessage: string | null;
};

export function PublicRegistration(props: Props) {
  const {
    slug,
    title,
    description,
    venue,
    startsAt,
    logoData,
    fields,
    benefits,
    themePrimary,
    themeAccent,
  } = props;

  // When the organizer set custom colours, override the key brand elements with
  // inline styles. Otherwise the built-in Kinetic Pulse classes render exactly
  // as before, so the default page is untouched.
  const custom = Boolean(themePrimary);
  const primary = themePrimary || "#5D3FD3";
  const accent = themeAccent || "#00F5FF";
  const st = {
    solid: custom ? { backgroundColor: primary } : undefined,
    codeBox: custom
      ? { backgroundColor: `${primary}14`, borderColor: `${primary}59`, color: primary }
      : undefined,
    avatar: custom ? { backgroundColor: `${primary}14`, color: primary } : undefined,
    chip: custom ? { backgroundColor: `${accent}26`, color: primary } : undefined,
    bullet: custom ? { color: primary } : undefined,
  };

  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);

  // Format the start time on the client only. toLocaleString() depends on the
  // machine's locale and time zone, so running it during SSR and again on the
  // client produces different strings and breaks hydration. Starting empty and
  // filling in after mount keeps the first client render identical to the
  // server's, and shows the attendee the time in their own local zone.
  const [startsText, setStartsText] = useState("");
  useEffect(() => {
    if (startsAt) setStartsText(new Date(startsAt).toLocaleString());
  }, [startsAt]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      const res = await api<RegisterResult>(`/api/public/${slug}/register`, {
        method: "POST",
        body: JSON.stringify({ values }),
      });
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
        setError("Please fix the highlighted fields.");
      } else {
        setError(err instanceof ApiError ? err.message : "Could not register.");
      }
      setBusy(false);
    }
  }

  // Success screen. The headline and message come from the organizer when set,
  // otherwise a sensible default that depends on whether codes are issued.
  if (result) {
    const hasCode = Boolean(result.code);
    const heading =
      result.confirmationTitle?.trim() ||
      (hasCode ? "You’re checked in" : "You’re registered");
    const message =
      result.confirmationMessage?.trim() ||
      (hasCode
        ? "Keep this code — you’ll need it to redeem your benefit."
        : "Thanks — your attendance has been recorded.");

    return (
      <div className="card overflow-hidden">
        <div
          className={`px-6 py-8 text-center text-white${custom ? "" : " bg-primary"}`}
          style={st.solid}
        >
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/15 text-2xl">
            ✓
          </div>
          <h1 className="mt-3 font-heading text-xl font-bold">{heading}</h1>
          <p className="mt-1 text-sm text-white/80">{message}</p>
        </div>
        <div className="px-6 py-6">
          {hasCode && (
            <div
              className={`rounded-xl border border-dashed px-4 py-5 text-center${
                custom ? "" : " border-primary-200 bg-primary-50"
              }`}
              style={st.codeBox}
            >
              <div className={`label${custom ? "" : " text-primary-700"}`}>
                Your registration code
              </div>
              <div
                className={`mt-1 font-mono text-2xl font-bold tracking-wider${
                  custom ? "" : " text-primary"
                }`}
              >
                {result.code}
              </div>
            </div>
          )}

          {benefits.length > 0 && (
            <div className={hasCode ? "mt-5" : ""}>
              <div className="label">
                {hasCode ? "What you’ve unlocked" : "What’s included"}
              </div>
              <ul className="mt-2 space-y-2">
                {benefits.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl bg-neutralbg px-4 py-3"
                  >
                    <span
                      className={`mt-0.5${custom ? "" : " text-secondary-700"}`}
                      style={st.bullet}
                    >
                      ◆
                    </span>
                    <div>
                      <div className="font-semibold text-ink">{b.label}</div>
                      {b.detail && (
                        <div className="text-sm text-ink-muted">{b.detail}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {hasCode && (
                <p className="mt-3 text-xs text-ink-muted">
                  Show your code to an event steward to redeem your benefit.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Event header */}
      <div className="border-b border-[var(--border)] p-6">
        <div className="flex items-center gap-4">
          {logoData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoData}
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div
              className={`grid h-14 w-14 place-items-center rounded-xl font-heading text-2xl font-bold${
                custom ? "" : " bg-primary-50 text-primary"
              }`}
              style={st.avatar}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-heading text-xl font-extrabold text-ink">{title}</h1>
            {venue && <p className="text-sm text-ink-muted">{venue}</p>}
            {startsText && (
              <p className="text-xs text-ink-muted">{startsText}</p>
            )}
          </div>
        </div>
        {description && (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
        {benefits.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {benefits.map((b, i) => (
              <span
                key={i}
                className={`chip${custom ? "" : " bg-secondary-50 text-secondary-800"}`}
                style={st.chip}
              >
                ◆ {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={submit} className="space-y-4 p-6">
        {fields.map((f) => (
          <Field
            key={f.key}
            field={f}
            value={values[f.key] ?? ""}
            error={fieldErrors[f.key]}
            onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
          />
        ))}

        {error && (
          <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          className={`w-full${custom ? " btn text-white shadow-card" : " btn-primary"}`}
          style={st.solid}
          disabled={busy}
        >
          {busy ? "Registering…" : "Register my attendance"}
        </button>
        <p className="text-center text-xs text-ink-muted">
          By registering you confirm your presence at this event.
        </p>
      </form>
    </div>
  );
}

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const base = "input mt-1.5" + (error ? " border-red-400 focus:border-red-400" : "");
  return (
    <div>
      <label className="label">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.type === "phone" ? (
        <PhoneField
          value={value}
          onChange={onChange}
          required={field.required}
          error={Boolean(error)}
        />
      ) : field.type === "textarea" ? (
        <textarea
          className={base + " min-h-24"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      ) : field.type === "select" ? (
        <select
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={base}
          type={
            field.type === "email"
              ? "email"
              : field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
