import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LiveCheckinDisplay } from "@/components/LiveCheckinDisplay";

export const dynamic = "force-dynamic";

// The entrance kiosk. Lives outside the dashboard chrome so it can go
// full-screen on a display. Access is limited to the event's staff.
export default async function CheckinDisplayPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { managers: { select: { userId: true } } },
  });
  if (!event) notFound();

  const allowed =
    user.role === "ADMIN" ||
    event.organizerId === user.id ||
    event.managers.some((m) => m.userId === user.id);
  if (!allowed) notFound();

  return (
    <LiveCheckinDisplay eventId={event.id} title={event.title} venue={event.venue} />
  );
}
