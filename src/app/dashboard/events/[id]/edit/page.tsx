import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventEditor, type EventEditorInitial } from "@/components/EventEditor";
import type { FormField, Benefit } from "@/lib/formSchema";

const rid = () => Math.random().toString(36).slice(2, 9);

// Convert a stored Date into the value a datetime-local input expects.
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) notFound();

  const isOwner = event.organizerId === user.id;
  if (!isOwner && user.role !== "ADMIN") notFound();

  const fields = (event.formSchema as unknown as FormField[]) ?? [];
  const benefits = (event.benefits as unknown as Benefit[]) ?? [];

  const initial: EventEditorInitial = {
    id: event.id,
    title: event.title,
    description: event.description ?? "",
    venue: event.venue ?? "",
    startsAt: toLocalInput(event.startsAt),
    endsAt: toLocalInput(event.endsAt),
    logoData: event.logoData,
    fields: fields.map((f) => ({
      id: rid(),
      label: f.label,
      type: f.type,
      required: f.required,
      optionsText: (f.options ?? []).join(", "),
    })),
    benefits: benefits.map((b) => ({
      id: rid(),
      label: b.label,
      detail: b.detail ?? "",
    })),
    codesEnabled: event.codesEnabled,
    confirmationTitle: event.confirmationTitle ?? "",
    confirmationMessage: event.confirmationMessage ?? "",
    registerButtonText: event.registerButtonText ?? "",
    registerButtonNote: event.registerButtonNote ?? "",
    maxRedemptions: event.maxRedemptions,
    themePrimary: event.themePrimary ?? "",
    themeAccent: event.themeAccent ?? "",
    embedLogoInQr: event.embedLogoInQr,
    requireLocation: event.requireLocation,
    enforceLocation: event.enforceLocation,
    latitude: event.latitude,
    longitude: event.longitude,
    radiusMeters: event.radiusMeters,
    locationLabel: event.locationLabel ?? "",
    smsEnabled: event.smsEnabled,
    smsTemplate: event.smsTemplate ?? "",
    secureCheckin: event.secureCheckin,
  };

  return (
    <div>
      <Link
        href={`/dashboard/events/${event.id}`}
        className="text-sm text-ink-muted hover:text-primary"
      >
        ← Back to event
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink">
        Edit event
      </h1>
      <div className="mt-6">
        <EventEditor initial={initial} />
      </div>
    </div>
  );
}
