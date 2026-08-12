import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, HttpError } from "@/lib/guards";
import { handle } from "@/lib/http";
import { formSchemaArray, benefitsArray } from "@/lib/formSchema";

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  venue: z.string().max(160).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  logoData: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
  formSchema: formSchemaArray.optional(),
  benefits: benefitsArray.optional(),
  codesEnabled: z.boolean().optional(),
  confirmationTitle: z.string().max(120).nullable().optional(),
  confirmationMessage: z.string().max(500).nullable().optional(),
});

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const { event } = await requireEventAccess(params.id);
    const full = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        managers: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { registrations: true, scans: true } },
      },
    });
    return { event: full };
  });
}

export async function PATCH(req: Request, { params }: Params) {
  return handle(async () => {
    // Only owners and admins may edit an event's definition.
    const { event, isOwner, isAdmin } = await requireEventAccess(params.id);
    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Only the organizer can edit this event.");
    }
    const body = updateSchema.parse(await req.json());

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        ...body,
        startsAt: body.startsAt === undefined ? undefined : body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt === undefined ? undefined : body.endsAt ? new Date(body.endsAt) : null,
      },
    });
    return { event: updated };
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  return handle(async () => {
    const { event, isOwner, isAdmin } = await requireEventAccess(params.id);
    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Only the organizer can delete this event.");
    }
    await prisma.event.delete({ where: { id: event.id } });
    return { ok: true };
  });
}
