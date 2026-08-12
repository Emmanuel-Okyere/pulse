import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, HttpError } from "@/lib/guards";
import { handle } from "@/lib/http";

const addSchema = z.object({ email: z.string().email() });

type Params = { params: { id: string } };

// Assign another registered user as a manager for this event.
export async function POST(req: Request, { params }: Params) {
  return handle(async () => {
    const { event, isOwner, isAdmin } = await requireEventAccess(params.id);
    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Only the organizer can add managers.");
    }
    const { email } = addSchema.parse(await req.json());

    const target = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!target) {
      throw new HttpError(404, "No registered user with that email. Ask them to sign up first.");
    }
    if (target.id === event.organizerId) {
      throw new HttpError(409, "The organizer already owns this event.");
    }

    await prisma.eventManager.upsert({
      where: { eventId_userId: { eventId: event.id, userId: target.id } },
      create: { eventId: event.id, userId: target.id },
      update: {},
    });
    return { ok: true };
  });
}

const removeSchema = z.object({ userId: z.string() });

export async function DELETE(req: Request, { params }: Params) {
  return handle(async () => {
    const { event, isOwner, isAdmin } = await requireEventAccess(params.id);
    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Only the organizer can remove managers.");
    }
    const { userId } = removeSchema.parse(await req.json());
    await prisma.eventManager.deleteMany({ where: { eventId: event.id, userId } });
    return { ok: true };
  });
}
