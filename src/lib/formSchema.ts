import { z } from "zod";

// Field types the organizer can add to a registration form.
export const FIELD_TYPES = [
  "text",
  "email",
  "phone",
  "number",
  "date",
  "select",
  "textarea",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const formFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1).max(80),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for "select"
});

export type FormField = z.infer<typeof formFieldSchema>;

export const formSchemaArray = z.array(formFieldSchema);

export const benefitSchema = z.object({
  label: z.string().min(1).max(80),
  detail: z.string().max(240).optional(),
});

export type Benefit = z.infer<typeof benefitSchema>;

export const benefitsArray = z.array(benefitSchema);

// Validate a set of submitted answers against a form schema. Returns either a
// cleaned data object or a map of per-field error messages.
export function validateSubmission(
  fields: FormField[],
  values: Record<string, unknown>
): { ok: true; data: Record<string, string> } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data: Record<string, string> = {};

  for (const field of fields) {
    const raw = values[field.key];
    const value = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw);

    if (field.required && !value) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }
    if (!value) {
      data[field.key] = "";
      continue;
    }

    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.key] = `Enter a valid email for ${field.label}`;
      continue;
    }
    // Accepts international numbers, e.g. "+233 241 234 567". The optional
    // leading + and the country code are supplied by the phone field's picker.
    if (field.type === "phone" && !/^[+]?[0-9\s()-]{7,25}$/.test(value)) {
      errors[field.key] = `Enter a valid phone number for ${field.label}`;
      continue;
    }
    if (field.type === "number" && Number.isNaN(Number(value))) {
      errors[field.key] = `${field.label} must be a number`;
      continue;
    }
    if (field.type === "select" && field.options && !field.options.includes(value)) {
      errors[field.key] = `Choose a valid option for ${field.label}`;
      continue;
    }

    data[field.key] = value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data };
}
