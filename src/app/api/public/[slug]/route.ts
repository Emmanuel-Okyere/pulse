import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";

type Params = { params: { slug: string } };

// Public endpoint: fetch the event a QR code points at, and record the scan.
// No authentication — this is what an attendee hits after scanning.
export async function GET(req: Request, { params }: Params) {
  return handle(async () => {
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
    });
    if (!event) throw new HttpError(404, "This event link is not valid.");
    if (event.status === "DRAFT") {
      throw new HttpError(403, "Registration for this event is not open yet.");
    }
    if (event.status === "CLOSED") {
      throw new HttpError(410, "Registration for this event has closed.");
    }

    // Record the visit for analytics. Failure here must not block registration.
    try {
      await prisma.scanEvent.create({
        data: {
          eventId: event.id,
          userAgent: req.headers.get("user-agent")?.slice(0, 300),
          referrer: req.headers.get("referer")?.slice(0, 300),
        },
      });
    } catch {
      /* analytics is best-effort */
    }

    return {
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        venue: event.venue,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        logoData: event.logoData,
        formSchema: event.formSchema,
        benefits: event.benefits,
      },
    };
  });
}
