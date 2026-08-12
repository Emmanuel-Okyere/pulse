import { describe, it, expect } from "vitest";
import { validateSubmission, type FormField } from "@/lib/formSchema";

const fields: FormField[] = [
  { key: "full_name", label: "Full name", type: "text", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "phone", label: "Phone", type: "phone", required: false },
  { key: "age", label: "Age", type: "number", required: false },
  {
    key: "level",
    label: "Level",
    type: "select",
    required: false,
    options: ["100", "200", "300"],
  },
];

describe("validateSubmission", () => {
  it("accepts a well-formed submission and trims values", () => {
    const res = validateSubmission(fields, {
      full_name: "  Kojo Mensah  ",
      email: "kojo@example.com",
      phone: "+233201234567",
      age: "24",
      level: "200",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.full_name).toBe("Kojo Mensah");
      expect(res.data.email).toBe("kojo@example.com");
    }
  });

  it("accepts an international phone number with country code and grouping", () => {
    const res = validateSubmission(fields, {
      full_name: "Kojo",
      email: "kojo@example.com",
      phone: "+233 241 234 567",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.phone).toBe("+233 241 234 567");
  });

  it("flags missing required fields", () => {
    const res = validateSubmission(fields, { email: "kojo@example.com" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.full_name).toMatch(/required/i);
  });

  it("rejects an invalid email", () => {
    const res = validateSubmission(fields, {
      full_name: "Kojo",
      email: "not-an-email",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.email).toBeTruthy();
  });

  it("rejects a non-numeric number field", () => {
    const res = validateSubmission(fields, {
      full_name: "Kojo",
      email: "kojo@example.com",
      age: "twenty",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.age).toMatch(/number/i);
  });

  it("rejects a select value outside the allowed options", () => {
    const res = validateSubmission(fields, {
      full_name: "Kojo",
      email: "kojo@example.com",
      level: "999",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.level).toBeTruthy();
  });

  it("treats optional empty fields as blank rather than errors", () => {
    const res = validateSubmission(fields, {
      full_name: "Kojo",
      email: "kojo@example.com",
      phone: "",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.phone).toBe("");
  });
});
