import { describe, it, expect } from "vitest";
import { signCheckinToken, verifyCheckinToken } from "@/lib/checkin";

describe("check-in tokens", () => {
  it("accepts a fresh token for its event", () => {
    const t = signCheckinToken("event-1");
    expect(verifyCheckinToken(t, "event-1")).toEqual({ valid: true });
  });

  it("rejects a token presented for a different event", () => {
    const t = signCheckinToken("event-1");
    expect(verifyCheckinToken(t, "event-2").valid).toBe(false);
  });

  it("rejects an expired token", () => {
    const t = signCheckinToken("event-1", -1); // already expired
    const res = verifyCheckinToken(t, "event-1");
    expect(res.valid).toBe(false);
    expect(res.expired).toBe(true);
  });

  it("rejects a tampered token", () => {
    const t = signCheckinToken("event-1");
    const tampered = t.slice(0, -2) + (t.endsWith("aa") ? "bb" : "aa");
    expect(verifyCheckinToken(tampered, "event-1").valid).toBe(false);
  });

  it("rejects a missing or malformed token", () => {
    expect(verifyCheckinToken(null, "event-1").valid).toBe(false);
    expect(verifyCheckinToken("garbage", "event-1").valid).toBe(false);
  });
});
