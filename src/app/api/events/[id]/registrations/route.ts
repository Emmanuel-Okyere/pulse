import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/guards";
import { handle } from "@/lib/http";
import { maskCode } from "@/lib/codes";

type Params = { params: { id: string } };

// List registrations for an event (organizer / manager / admin view).
// The full code is deliberately never transmitted: only a masked form is sent,
// so it cannot be harvested through network inspection.
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const { event } = await requireEventAccess(params.id);
    const rows = await prisma.registration.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        data: true,
        redeemed: true,
        redeemedAt: true,
        redeemCount: true,
        createdAt: true,
      },
    });

    const registrations = rows.map((r) => ({
      id: r.id,
      codeMasked: maskCode(r.code),
      data: r.data,
      redeemed: r.redeemed,
      redeemedAt: r.redeemedAt,
      redeemCount: r.redeemCount,
      createdAt: r.createdAt,
    }));

    return { registrations, formSchema: event.formSchema };
  });
}
