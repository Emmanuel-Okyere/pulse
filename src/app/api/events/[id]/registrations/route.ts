import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/guards";
import { handle } from "@/lib/http";

type Params = { params: { id: string } };

// List registrations for an event (organizer / manager / admin view).
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const { event } = await requireEventAccess(params.id);
    const registrations = await prisma.registration.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
    });
    return { registrations, formSchema: event.formSchema };
  });
}
