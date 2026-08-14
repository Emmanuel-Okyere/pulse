import { describe, it, expect } from "vitest";
import { haversineMeters, withinGeofence, isValidLatLng } from "@/lib/geo";
import {
  toGhanaMsisdn,
  registrationMessage,
  renderSmsTemplate,
  composeSms,
} from "@/lib/sms";

describe("haversineMeters", () => {
  it("is zero for the same point", () => {
    expect(haversineMeters(5.6037, -0.187, 5.6037, -0.187)).toBe(0);
  });

  it("measures a short distance roughly correctly", () => {
    // ~111 m per 0.001 degree of latitude near the equator.
    const d = haversineMeters(5.6037, -0.187, 5.6047, -0.187);
    expect(d).toBeGreaterThan(90);
    expect(d).toBeLessThan(130);
  });

  it("measures a known long distance (Accra to Kumasi ~ 200 km)", () => {
    const d = haversineMeters(5.6037, -0.187, 6.6885, -1.6244);
    expect(d).toBeGreaterThan(190000);
    expect(d).toBeLessThan(220000);
  });
});

describe("withinGeofence", () => {
  it("accepts a point inside the radius", () => {
    expect(withinGeofence(120, 200, 10)).toBe(true);
  });
  it("rejects a point beyond the radius and tolerance", () => {
    expect(withinGeofence(500, 200, 30)).toBe(false);
  });
  it("adds GPS accuracy as tolerance, capped at 100 m", () => {
    expect(withinGeofence(250, 200, 80)).toBe(true); // 200 + 80
    expect(withinGeofence(350, 200, 500)).toBe(false); // capped at 200 + 100
  });
});

describe("isValidLatLng", () => {
  it("accepts valid coordinates", () => {
    expect(isValidLatLng(5.6, -0.18)).toBe(true);
  });
  it("rejects out-of-range coordinates", () => {
    expect(isValidLatLng(95, 0)).toBe(false);
    expect(isValidLatLng(0, 200)).toBe(false);
  });
});

describe("toGhanaMsisdn", () => {
  it("converts an international number to local Ghana format", () => {
    expect(toGhanaMsisdn("+233 24 123 4567")).toBe("0241234567");
  });
  it("keeps a local number in local format", () => {
    expect(toGhanaMsisdn("0241234567")).toBe("0241234567");
  });
  it("prefixes a bare nine-digit national number", () => {
    expect(toGhanaMsisdn("241234567")).toBe("0241234567");
  });
});

describe("registrationMessage", () => {
  it("includes the event title and the code", () => {
    const msg = registrationMessage("Founders Mixer", "PLS-7KQ4-M9TX");
    expect(msg).toContain("Founders Mixer");
    expect(msg).toContain("PLS-7KQ4-M9TX");
  });
});

describe("renderSmsTemplate", () => {
  const vars = {
    code: "PLS-7KQ4-M9TX",
    event: "Founders Mixer",
    name: "Ama",
    venue: "Accra Digital Centre",
    date: "20 Aug 2026",
  };

  it("substitutes every placeholder, wherever the organizer put it", () => {
    const msg = renderSmsTemplate(
      "Hi {name}, your {event} code is {code}. See you at {venue} on {date}.",
      vars
    );
    expect(msg).toBe(
      "Hi Ama, your Founders Mixer code is PLS-7KQ4-M9TX. See you at Accra Digital Centre on 20 Aug 2026."
    );
  });

  it("matches tokens case-insensitively and ignores inner spacing", () => {
    expect(renderSmsTemplate("Code: { CODE }", vars)).toBe("Code: PLS-7KQ4-M9TX");
  });

  it("drops a token that has no value and tidies the spacing", () => {
    const msg = renderSmsTemplate("Hi {name}, code {code}.", {
      ...vars,
      name: null,
    });
    expect(msg).toBe("Hi, code PLS-7KQ4-M9TX.");
  });

  it("leaves an unknown token untouched", () => {
    expect(renderSmsTemplate("Ref {order}", vars)).toBe("Ref {order}");
  });
});

describe("composeSms", () => {
  const vars = { code: "PLS-7KQ4-M9TX", event: "Founders Mixer" };

  it("uses the organizer template when one is set", () => {
    expect(composeSms("Your code {code}", vars)).toBe("Your code PLS-7KQ4-M9TX");
  });

  it("falls back to the default when the template is blank", () => {
    expect(composeSms("   ", vars)).toBe(registrationMessage(vars.event, vars.code));
    expect(composeSms(null, vars)).toBe(registrationMessage(vars.event, vars.code));
  });
});
