import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "@/lib/auth";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("Password123");
    expect(hash).not.toBe("Password123");
    expect(await verifyPassword("Password123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  const user = {
    id: "u1",
    email: "a@b.com",
    name: "Test",
    role: "ORGANIZER" as const,
  };

  it("round-trips a valid token", () => {
    const token = signToken(user);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(user);
  });

  it("returns null for a tampered token", () => {
    const token = signToken(user);
    expect(verifyToken(token + "x")).toBeNull();
  });

  it("returns null for a garbage token", () => {
    expect(verifyToken("not.a.jwt")).toBeNull();
  });
});
