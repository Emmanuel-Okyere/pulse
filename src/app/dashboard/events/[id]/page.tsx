import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventWorkspace } from "@/components/EventWorkspace";
import type { FormField, Benefit } from "@/lib/formSchema";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      managers: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!event) notFound();

  const isAdmin = user.role === "ADMIN";
  const isOwner = event.organizerId === user.id;
  const isManager = event.managers.some((m) => m.userId === user.id);
  if (!isAdmin && !isOwner && !isManager) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-primary">
        ← Back to events
      </Link>
      <EventWorkspace
        canEdit={isOwner || isAdmin}
        registrationUrl={`${baseUrl}/r/${event.slug}`}
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          venue: event.venue,
          status: event.status,
          logoData: event.logoData,
          organizerName: event.organizer.name,
          codesEnabled: event.codesEnabled,
          embedLogoInQr: event.embedLogoInQr,
          fields: (event.formSchema as unknown as FormField[]) ?? [],
          benefits: (event.benefits as unknown as Benefit[]) ?? [],
          managers: event.managers.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
          })),
        }}
      />
    </div>
  );
}
