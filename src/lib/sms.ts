// SMS delivery via GiantSMS (https://api.giantsms.com). Credentials come from
// the environment; when they are absent the sender no-ops so local development
// and events without SMS keep working.

// Convert a stored phone number to the local Ghana MSISDN GiantSMS expects,
// e.g. "+233 24 123 4567" or "0241234567" -> "0241234567". Numbers that are
// not Ghanaian are returned as their bare digits, which GiantSMS may reject.
export function toGhanaMsisdn(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("233")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  // A Ghana national number is 9 digits; prefix the trunk 0.
  if (d.length === 9) return "0" + d;
  return d;
}

export type SmsResult = { ok: boolean; error?: string };

export async function sendSms(to: string, msg: string): Promise<SmsResult> {
  const auth = process.env.GIANTSMS_AUTH;
  const from = process.env.GIANTSMS_SENDER || "Pulse";
  if (!auth) {
    console.warn("SMS skipped: GIANTSMS_AUTH is not configured.");
    return { ok: false, error: "not-configured" };
  }

  const form = new FormData();
  form.append("from", from);
  form.append("to", to);
  form.append("msg", msg);

  try {
    const res = await fetch("https://api.giantsms.com/api/v1/send", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("GiantSMS send failed", res.status, body.slice(0, 200));
      return { ok: false, error: `http ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("GiantSMS request error", e);
    return { ok: false, error: "request-failed" };
  }
}

// Compose the registration SMS. Kept short to fit a single message segment.
export function registrationMessage(
  eventTitle: string,
  code: string
): string {
  return `Pulse: you're registered for ${eventTitle}. Your code is ${code}. Keep it to redeem your benefit.`;
}
