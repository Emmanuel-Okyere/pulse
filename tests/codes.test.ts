import { describe, it, expect } from "vitest";
import {
  generateRegistrationCode,
  slugify,
  normalizeCode,
  maskCode,
} from "@/lib/codes";

describe("normalizeCode", () => {
  it("accepts the canonical form", () => {
    expect(normalizeCode("PLS-U2UC-M9TX")).toBe("PLS-U2UC-M9TX");
  });
  it("accepts the code without dashes and in lower case", () => {
    expect(normalizeCode("plsu2ucm9tx")).toBe("PLS-U2UC-M9TX");
  });
  it("accepts the eight-character body without the PLS prefix", () => {
    expect(normalizeCode("u2uc m9tx")).toBe("PLS-U2UC-M9TX");
  });
  it("rejects the wrong length", () => {
    expect(normalizeCode("PLS-U2UC")).toBeNull();
  });
  it("rejects characters outside the code alphabet", () => {
    // 0, O, 1 and I are never used in codes.
    expect(normalizeCode("PLS-0OI1-M9TX")).toBeNull();
  });
});

describe("maskCode", () => {
  it("reveals the prefix and last group only", () => {
    expect(maskCode("PLS-U2UC-M9TX")).toBe("PLS-••••-M9TX");
  });
  it("passes null through", () => {
    expect(maskCode(null)).toBeNull();
  });
});

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
