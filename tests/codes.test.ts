import { describe, it, expect } from "vitest";
import { generateRegistrationCode, slugify } from "@/lib/codes";

describe("generateRegistrationCode", () => {
  it("matches the PLS-XXXX-XXXX shape", () => {
    const code = generateRegistrationCode();
    expect(code).toMatch(/^PLS-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("never uses ambiguous characters (0,O,1,I)", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateRegistrationCode()).not.toMatch(/[01OI]/);
    }
  });

  it("is effectively unique across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(generateRegistrationCode());
    // Allow for the astronomically unlikely collision, but expect near-uniqueness.
    expect(seen.size).toBeGreaterThan(4990);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugify("Founders Mixer 2026")).toMatch(/^founders-mixer-2026-[a-z2-9]{5}$/);
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("  Hello!!  World??  ")).toMatch(/^hello-world-[a-z2-9]{5}$/);
  });

  it("still returns a slug for an empty-ish title", () => {
    expect(slugify("!!!")).toMatch(/^[a-z2-9]{5}$/);
  });

  it("produces different slugs for the same title", () => {
    expect(slugify("Repeat")).not.toBe(slugify("Repeat"));
  });
});
