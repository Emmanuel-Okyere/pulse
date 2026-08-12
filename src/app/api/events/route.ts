import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
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
        organizerId: user.id,
      },
    });
    return { event };
  });
}
