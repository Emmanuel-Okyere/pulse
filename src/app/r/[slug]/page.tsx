import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicRegistration } from "@/components/PublicRegistration";
import { Logo } from "@/components/Logo";
import type { FormField, Benefit } from "@/lib/formSchema";

// Always render fresh so each visit records a scan and reflects the live form.
export const dynamic = "force-dynamic";

export default async function PublicEventPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const closed = event.status === "CLOSED";
  const notOpen = event.status === "DRAFT";

  // Record the visit (best-effort) when registration is actually open.
  if (event.status === "PUBLISHED") {
    try {
      await prisma.scanEvent.create({ data: { eventId: event.id } });
    } catch {
      /* analytics is best-effort */
    }
  }

  return (
    <main className="min-h-screen bg-neutralbg">
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {notOpen && (
          <Notice
            title="Registration is not open yet"
            body="The organizer hasn’t opened registration for this event. Please check back later."
          />
        )}
        {closed && (
          <Notice
            title="Registration has closed"
            body="Thanks for your interest — this event is no longer accepting registrations."
          />
        )}

        {event.status === "PUBLISHED" && (
          <PublicRegistration
            slug={event.slug}
            title={event.title}
            description={event.description}
            venue={event.venue}
            startsAt={event.startsAt?.toISOString() ?? null}
            logoData={event.logoData}
            fields={(event.formSchema as unknown as FormField[]) ?? []}
            benefits={(event.benefits as unknown as Benefit[]) ?? []}
          />
        )}
      </div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <h1 className="font-heading text-xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
