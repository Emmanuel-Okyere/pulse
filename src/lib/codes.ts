import { customAlphabet } from "nanoid";

// Human-friendly alphabet: no 0/O/1/I to avoid confusion when an attendee
// reads a code aloud or types it back in.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const nano = customAlphabet(ALPHABET, 8);

// Registration code, e.g. "PLS-7KQ4-M9TX".
export function generateRegistrationCode(): string {
  const raw = nano();
  return `PLS-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

// Turn whatever the staff member typed into the canonical PLS-XXXX-XXXX form,
// so the dashes are optional and case does not matter. Returns null when the
// input cannot be a valid code. Accepts "plsu2ucm9tx", "U2UC M9TX", etc.
export function normalizeCode(input: string): string | null {
  let s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.startsWith("PLS")) s = s.slice(3);
  // The body is exactly 8 characters from the code alphabet.
  if (s.length !== 8) return null;
  if (!s.split("").every((ch) => ALPHABET.includes(ch))) return null;
  return `PLS-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

// Mask a code for display so the full value is never exposed. Reveals the
// prefix and the last group only: "PLS-••••-M9TX".
export function maskCode(code: string | null): string | null {
  if (!code) return null;
  const parts = code.split("-");
  if (parts.length !== 3) return code.slice(0, 4) + "••••";
  return `${parts[0]}-••••-${parts[2]}`;
}

// Turn a title into a URL slug and append a short suffix for uniqueness.
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = customAlphabet(ALPHABET.toLowerCase(), 5)();
  return base ? `${base}-${suffix}` : suffix;
}
