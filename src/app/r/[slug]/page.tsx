import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicRegistration } from "@/components/PublicRegistration";
import { Logo } from "@/components/Logo";
import { verifyCheckinToken } from "@/lib/checkin";
import type { FormField, Benefit } from "@/lib/formSchema";

// Always render fresh so each visit records a scan and reflects the live form.
export const dynamic = "force-dynamic";

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string };
}) {
  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  const closed = event.status === "CLOSED";
  const notOpen = event.status === "DRAFT";

  // Secure check-in: only a valid, unexpired token from the live entrance
  // display admits the form. The token is re-checked on submit as well.
  const token = searchParams?.t ?? null;
  const checkin = event.secureCheckin
    ? verifyCheckinToken(token, event.id)
    : { valid: true };
  const gateFailed = event.status === "PUBLISHED" && !checkin.valid;

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

        {gateFailed && (
          <Notice
            title={
              checkin.expired
                ? "That entry code has expired"
                : "Scan the code at the entrance"
            }
            body={
              checkin.expired
                ? "For security, entry codes refresh every minute. Please scan the live code shown at the entrance again."
                : "This event uses secure check-in. Please scan the code displayed at the entrance to register."
            }
          />
        )}

        {event.status === "PUBLISHED" && !gateFailed && (
          <PublicRegistration
            slug={event.slug}
            title={event.title}
            description={event.description}
            venue={event.venue}
            startsAt={event.startsAt?.toISOString() ?? null}
            logoData={event.logoData}
            fields={(event.formSchema as unknown as FormField[]) ?? []}
            benefits={(event.benefits as unknown as Benefit[]) ?? []}
            themePrimary={event.themePrimary}
            themeAccent={event.themeAccent}
            requireLocation={event.requireLocation}
            enforceLocation={event.enforceLocation}
            locationLabel={event.locationLabel}
            buttonText={event.registerButtonText}
            buttonNote={event.registerButtonNote}
            checkinToken={token}
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
