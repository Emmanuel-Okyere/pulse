import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, HttpError } from "@/lib/guards";
import { handle } from "@/lib/http";
import { slugify } from "@/lib/codes";
import { formSchemaArray, benefitsArray } from "@/lib/formSchema";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  venue: z.string().max(160).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  logoData: z.string().optional(),
  formSchema: formSchemaArray.default([]),
  benefits: benefitsArray.default([]),
  codesEnabled: z.boolean().default(true),
  confirmationTitle: z.string().max(120).nullable().optional(),
  confirmationMessage: z.string().max(500).nullable().optional(),
  maxRedemptions: z.number().int().min(0).max(100000).default(1),
  themePrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  themeAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  embedLogoInQr: z.boolean().default(true),
  requireLocation: z.boolean().default(false),
  enforceLocation: z.boolean().default(false),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  radiusMeters: z.number().int().min(10).max(50000).default(200),
  locationLabel: z.string().max(200).nullable().optional(),
  smsEnabled: z.boolean().default(false),
  secureCheckin: z.boolean().default(false),
});

// GET /api/events — list events visible to the current user.
export async function GET() {
  return handle(async () => {
    const user = await requireUser();

    // Admins see everything; everyone else sees what they own or manage.
    const where =
      user.role === "ADMIN"
        ? {}
        : {
            OR: [
              { organizerId: user.id },
              { managers: { some: { userId: user.id } } },
            ],
          };

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        organizer: { select: { name: true, email: true } },
        _count: { select: { registrations: true, scans: true } },
      },
    });
    return { events };
  });
}

// POST /api/events — create a new event owned by the current user.
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());

    if (body.requireLocation && (body.latitude == null || body.longitude == null)) {
      throw new HttpError(422, "Set the venue location to verify attendance.");
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        slug: slugify(body.title),
        description: body.description,
        venue: body.venue,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        logoData: body.logoData,
        formSchema: body.formSchema,
        benefits: body.benefits,
        codesEnabled: body.codesEnabled,
        confirmationTitle: body.confirmationTitle,
        confirmationMessage: body.confirmationMessage,
        maxRedemptions: body.maxRedemptions,
        themePrimary: body.themePrimary,
        themeAccent: body.themeAccent,
        embedLogoInQr: body.embedLogoInQr,
        requireLocation: body.requireLocation,
        enforceLocation: body.enforceLocation,
        latitude: body.latitude,
        longitude: body.longitude,
        radiusMeters: body.radiusMeters,
        locationLabel: body.locationLabel,
        smsEnabled: body.smsEnabled,
        secureCheckin: body.secureCheckin,
        organizerId: user.id,
      },
    });
    return { event };
  });
}
