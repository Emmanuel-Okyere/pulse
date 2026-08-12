import { getSession, type SessionUser } from "./auth";
import { prisma } from "./prisma";

// Thrown by guard helpers; API routes translate it into an HTTP status.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Require a logged-in user or fail with 401.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new HttpError(401, "You must be signed in.");
  return user;
}

// Resolve an event the current user is allowed to manage.
// Admins can reach any event. Organizers reach the events they own.
// Managers reach events they have been assigned to.
export async function requireEventAccess(eventId: string) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { managers: true },
  });
  if (!event) throw new HttpError(404, "Event not found.");

  const isAdmin = user.role === "ADMIN";
  const isOwner = event.organizerId === user.id;
  const isManager = event.managers.some((m) => m.userId === user.id);

  if (!isAdmin && !isOwner && !isManager) {
    throw new HttpError(403, "You do not have access to this event.");
  }
  return { user, event, isOwner, isAdmin };
}
