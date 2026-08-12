import crypto from "crypto";

// Short-lived, HMAC-signed tokens for secure check-in. A token proves that the
// bearer scanned the live entrance display recently: it is bound to one event
// and expires, so a screenshotted or forwarded QR/link stops working after the
// window closes. Tokens are not one-time — the entrance QR is shared by many
// people in the same window — so time-boxing (plus the geofence) is the control.

const SECRET =
  process.env.CHECKIN_SECRET || process.env.JWT_SECRET || "insecure-dev-secret";

// How long a freshly minted token is accepted for registration.
export const CHECKIN_TTL_SECONDS = 180;
// How often the live display mints a new token.
export const CHECKIN_ROTATE_SECONDS = 60;

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function signCheckinToken(
  eventId: string,
  ttlSeconds = CHECKIN_TTL_SECONDS
): string {
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = `${eventId}.${exp}`;
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(payload)}`;
}

export type CheckinCheck = { valid: boolean; expired?: boolean };

export function verifyCheckinToken(
  token: string | null | undefined,
  eventId: string
): CheckinCheck {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [body, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString();
  } catch {
    return { valid: false };
  }

  const expected = sign(payload);
  // Constant-time comparison over equal-length buffers.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }

  const [eid, expStr] = payload.split(".");
  if (eid !== eventId) return { valid: false };
  if (Date.now() > Number(expStr)) return { valid: false, expired: true };
  return { valid: true };
}
