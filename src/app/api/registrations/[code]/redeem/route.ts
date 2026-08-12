import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/guards";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";
import { normalizeCode, maskCode } from "@/lib/codes";

type Params = { params: { code: string } };

// Is another redemption still allowed given the event's limit?
// max = 1 single use, 0 unlimited, N up to N times.
function canRedeemMore(count: number, max: number): boolean {
  if (max === 0) return true;
  return count < max;
}

// Look up a registration by its attendee code so staff can verify presence.
// The typed code may omit dashes and use any case.
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const code = normalizeCode(params.code);
    if (!code) throw new HttpError(400, "That does not look like a valid code.");

    const registration = await prisma.registration.findUnique({
      where: { code },
      include: {
        event: {
          select: { id: true, title: true, benefits: true, maxRedemptions: true },
        },
      },
    });
    if (!registration) throw new HttpError(404, "No registration matches that code.");
    // Confirm the caller is allowed to see this event's registrations.
    await requireEventAccess(registration.eventId);

    // Never echo the raw code back over the network; the staff member already
    // holds it. The masked form is enough to confirm the match on screen.
    return {
      registration: {
        codeMasked: maskCode(registration.code),
        data: registration.data,
        redeemed: registration.redeemed,
        redeemedAt: registration.redeemedAt,
        redeemCount: registration.redeemCount,
        eventId: registration.eventId,
        event: {
          id: registration.event.id,
          title: registration.event.title,
          benefits: registration.event.benefits,
          maxRedemptions: registration.event.maxRedemptions,
        },
        canRedeem: canRedeemMore(
          registration.redeemCount,
          registration.event.maxRedemptions
        ),
      },
    };
  });
}

// Record a redemption. Respects the event's redemption limit: single-use events
// refuse a second redemption; multi-use events allow up to the configured count
// (or unlimited), incrementing the counter each time.
export async function POST(_req: Request, { params }: Params) {
  return handle(async () => {
    const code = normalizeCode(params.code);
    if (!code) throw new HttpError(400, "That does not look like a valid code.");

    const registration = await prisma.registration.findUnique({
      where: { code },
      include: { event: { select: { maxRedemptions: true } } },
    });
    if (!registration) throw new HttpError(404, "No registration matches that code.");
    await requireEventAccess(registration.eventId);

    const max = registration.event.maxRedemptions;
    if (!canRedeemMore(registration.redeemCount, max)) {
      return {
        redeemed: false,
        limitReached: true,
        redeemCount: registration.redeemCount,
        maxRedemptions: max,
        redeemedAt: registration.redeemedAt,
      };
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        redeemed: true,
        redeemedAt: new Date(),
        redeemCount: { increment: 1 },
      },
    });
    return {
      redeemed: true,
      limitReached: false,
      redeemCount: updated.redeemCount,
      maxRedemptions: max,
      canRedeem: canRedeemMore(updated.redeemCount, max),
      redeemedAt: updated.redeemedAt,
    };
  });
}
