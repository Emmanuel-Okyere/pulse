"use client";

import { useState } from "react";

// A pragmatic list of dialling codes. Ghana leads because the platform's first
// users are Ghanaian events; the rest cover common international cases.
export const COUNTRIES: { name: string; iso: string; dial: string; flag: string }[] = [
  { name: "Ghana", iso: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Nigeria", iso: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Kenya", iso: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "South Africa", iso: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "Côte d’Ivoire", iso: "CI", dial: "+225", flag: "🇨🇮" },
  { name: "Togo", iso: "TG", dial: "+228", flag: "🇹🇬" },
  { name: "Benin", iso: "BJ", dial: "+229", flag: "🇧🇯" },
  { name: "Burkina Faso", iso: "BF", dial: "+226", flag: "🇧🇫" },
  { name: "Senegal", iso: "SN", dial: "+221", flag: "🇸🇳" },
  { name: "Cameroon", iso: "CM", dial: "+237", flag: "🇨🇲" },
  { name: "Egypt", iso: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Morocco", iso: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Ethiopia", iso: "ET", dial: "+251", flag: "🇪🇹" },
  { name: "Tanzania", iso: "TZ", dial: "+255", flag: "🇹🇿" },
  { name: "Uganda", iso: "UG", dial: "+256", flag: "🇺🇬" },
  { name: "Rwanda", iso: "RW", dial: "+250", flag: "🇷🇼" },
  { name: "United States", iso: "US", dial: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", iso: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "Canada", iso: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Germany", iso: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "France", iso: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Netherlands", iso: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "Spain", iso: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Italy", iso: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "India", iso: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "China", iso: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", iso: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "Australia", iso: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "Brazil", iso: "BR", dial: "+55", flag: "🇧🇷" },
];

const DEFAULT_ISO = "GH";

// Group national digits into readable triples: 241234567 -> "241 234 567".
function group(digits: string): string {
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

// Compose the full international value that gets stored. Empty when the attendee
// has typed no number, so "required" and "optional" both behave correctly.
function compose(dial: string, digits: string): string {
  return digits ? `${dial} ${group(digits)}` : "";
}

export function PhoneField({
  value,
  onChange,
  required,
  error,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: boolean;
  id?: string;
}) {
  // Derive initial internal state from any incoming value (once).
  const [iso, setIso] = useState(() => {
    const match = COUNTRIES.find((c) => value.startsWith(c.dial + " "));
    return match?.iso ?? DEFAULT_ISO;
  });
  const [digits, setDigits] = useState(() => value.replace(/[^\d]/g, ""));

  const country =
    COUNTRIES.find((c) => c.iso === iso) ??
    COUNTRIES.find((c) => c.iso === DEFAULT_ISO)!;

  function setCountry(nextIso: string) {
    setIso(nextIso);
    const dial = COUNTRIES.find((c) => c.iso === nextIso)?.dial ?? country.dial;
    onChange(compose(dial, digits));
  }

  function setNumber(raw: string) {
    const next = raw.replace(/[^\d]/g, "").slice(0, 15);
    setDigits(next);
    onChange(compose(country.dial, next));
  }

  const border = error ? "border-red-400 focus-within:border-red-400" : "border-[var(--border)] focus-within:border-primary";

  return (
    <div
      className={`mt-1.5 flex items-stretch overflow-hidden rounded-xl border ${border} bg-white transition focus-within:ring-2 focus-within:ring-primary-100`}
    >
      <select
        aria-label="Country code"
        value={iso}
        onChange={(e) => setCountry(e.target.value)}
        className="border-r border-[var(--border)] bg-neutralbg px-2 text-sm text-ink outline-none"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <span className="flex items-center pl-3 pr-1 text-sm text-ink-muted">
        {country.dial}
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className="w-full bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-gray-400"
        placeholder="24 123 4567"
        value={group(digits)}
        onChange={(e) => setNumber(e.target.value)}
        required={required}
      />
    </div>
  );
}
