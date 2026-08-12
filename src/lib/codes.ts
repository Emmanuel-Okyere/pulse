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
