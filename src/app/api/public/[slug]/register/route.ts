import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";
import { generateRegistrationCode } from "@/lib/codes";
import { haversineMeters, withinGeofence } from "@/lib/geo";
import { sendSms, toGhanaMsisdn, composeSms } from "@/lib/sms";
import { verifyCheckinToken } from "@/lib/checkin";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { formSchemaArray, validateSubmission, type FormField } from "@/lib/formSchema";

const schema = z.object({
  values: z.record(z.string(), z.unknown()),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    })
    .optional(),
  token: z.string().optional(),
});

type Params = { params: { slug: string } };

// Public endpoint: submit a registration for an event.
export async function POST(req: Request, { params }: Params) {
  return handle(async () => {
    // Throttle abusive clients before doing any real work.
    await rateLimit("register", `${params.slug}:${clientIp(req)}`, 15);

    const event = await prisma.event.findUnique({ where: { slug: params.slug } });
    if (!event) throw new HttpError(404, "This event link is not valid.");
    if (event.status !== "PUBLISHED") {
      throw new HttpError(410, "Registration for this event is not open.");
    }

    const { values, location, token } = schema.parse(await req.json());

    // Secure check-in: require a valid, unexpired token from the live display.
    if (event.secureCheckin) {
      const check = verifyCheckinToken(token, event.id);
      if (!check.valid) {
        throw new HttpError(
          403,
          check.expired
            ? "Your entry code has expired. Please rescan the code at the entrance."
            : "Please scan the check-in code shown at the entrance to register."
        );
      }
    }

    const fields = formSchemaArray.parse(event.formSchema) as FormField[];

    const result = validateSubmission(fields, values);
    if (!result.ok) {
      // Structured per-field errors so the form can highlight each input.
      return NextResponse.json({ fieldErrors: result.errors }, { status: 422 });
    }

    // Presence check. When the event verifies location, compute how far the
    // attendee is from the venue and flag them on-site or off-site. If the event
    // enforces location, an off-site or unknown attendee is turned away;
    // otherwise they can still register and are simply flagged.
    let atVenue: boolean | null = null;
    let distanceMeters: number | null = null;
    if (event.requireLocation && event.latitude != null && event.longitude != null) {
      if (location) {
        distanceMeters = haversineMeters(
          event.latitude,
          event.longitude,
          location.lat,
          location.lng
        );
        atVenue = withinGeofence(distanceMeters, event.radiusMeters, location.accuracy);
        if (!atVenue && event.enforceLocation) {
          throw new HttpError(
            403,
            `You appear to be about ${distanceMeters} m from the venue. Please register on site.`
          );
        }
      } else if (event.enforceLocation) {
        throw new HttpError(
          400,
          "This event needs your location to register. Please allow location access and try again."
        );
      }
    }

    // Only issue a code when the organizer enabled them for this event.
    let code: string | null = null;
    const baseData = { data: result.data, atVenue, distanceMeters } as const;
    if (event.codesEnabled) {
      // Retry a couple of times in the (astronomically unlikely) event of a
      // code collision on the unique index.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const created = await prisma.registration.create({
            data: { eventId: event.id, code: generateRegistrationCode(), ...baseData },
          });
          code = created.code;
          break;
        } catch (e) {
          if (attempt === 2) throw e;
        }
      }
    } else {
      await prisma.registration.create({
        data: { eventId: event.id, ...baseData },
      });
    }

    // Best-effort SMS delivery of the code. Never blocks the registration.
    let smsSent = false;
    if (event.smsEnabled && code) {
      const phone = firstPhone(fields, result.data);
      if (phone) {
        const message = composeSms(event.smsTemplate, {
          code,
          event: event.title,
          name: firstName(fields, result.data),
          venue: event.locationLabel || event.venue,
          date: event.startsAt
            ? event.startsAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : null,
        });
        const res = await sendSms(toGhanaMsisdn(phone), message);
        smsSent = res.ok;
      }
    }

    return {
      code, // null when codes are disabled
      codesEnabled: event.codesEnabled,
      benefits: event.benefits,
      eventTitle: event.title,
      confirmationTitle: event.confirmationTitle,
      confirmationMessage: event.confirmationMessage,
      atVenue,
      smsSent,
    };
  });
}

// The value of the first phone-type field, if any.
function firstPhone(fields: FormField[], data: Record<string, string>): string | null {
  const field = fields.find((f) => f.type === "phone");
  if (!field) return null;
  const v = data[field.key];
  return v ? v : null;
}

// A friendly first name for the {name} SMS token. Prefer a field that looks
// like a name (key or label contains "name"), else the first text field, and
// use just the given name so the message stays personal and short.
function firstName(fields: FormField[], data: Record<string, string>): string | null {
  const named =
    fields.find(
      (f) =>
        f.type === "text" &&
        /name/i.test(`${f.key} ${f.label}`) &&
        !/user|company|last|sur/i.test(`${f.key} ${f.label}`)
    ) ?? fields.find((f) => f.type === "text");
  const full = named ? data[named.key] : "";
  return full ? full.trim().split(/\s+/)[0] : null;
}
