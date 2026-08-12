import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/guards";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";

type Params = { params: { code: string } };

// Look up a registration by its attendee code so staff can verify presence.
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const registration = await prisma.registration.findUnique({
      where: { code: params.code.toUpperCase() },
      include: { event: { select: { id: true, title: true, benefits: true } } },
    });
    if (!registration) throw new HttpError(404, "No registration matches that code.");
    // Confirm the caller is allowed to see this event's registrations.
    await requireEventAccess(registration.eventId);
    return { registration };
  });
}

// Mark a registration as redeemed (benefit collected). Idempotent-ish: a second
// call reports it was already redeemed rather than silently double-counting.
export async function POST(_req: Request, { params }: Params) {
  return handle(async () => {
    const registration = await prisma.registration.findUnique({
      where: { code: params.code.toUpperCase() },
    });
    if (!registration) throw new HttpError(404, "No registration matches that code.");
    await requireEventAccess(registration.eventId);

    if (registration.redeemed) {
      return { alreadyRedeemed: true, redeemedAt: registration.redeemedAt };
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { redeemed: true, redeemedAt: new Date() },
    });
    return { alreadyRedeemed: false, redeemedAt: updated.redeemedAt };
  });
}
