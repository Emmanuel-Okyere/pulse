import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-secondary-50 text-secondary-800",
  CLOSED: "bg-primary-50 text-primary-700",
};

export default async function DashboardHome() {
  const user = (await getSession())!;

  const where =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { organizerId: user.id },
            { managers: { some: { userId: user.id } } },
          ],
        };

  const events = await prisma.event.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      organizer: { select: { name: true } },
      _count: { select: { registrations: true, scans: true } },
    },
  });

  const totalReg = events.reduce((n, e) => n + e._count.registrations, 0);
  const totalScans = events.reduce((n, e) => n + e._count.scans, 0);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
            {user.role === "ADMIN" ? "All events" : "Your events"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.role === "ADMIN"
              ? "Every event across the platform."
              : "Events you own or help manage."}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Events" value={events.length} />
        <Stat label="Total scans" value={totalScans} />
        <Stat label="Total registrations" value={totalReg} />
      </div>

      {/* Event list */}
      <div className="mt-8">
        {events.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
            <h3 className="font-heading text-lg font-bold text-ink">
              No events yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Create your first event to generate a QR code and start collecting
              registrations.
            </p>
            <Link href="/dashboard/events/new" className="btn-primary mt-5">
              Create an event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/events/${e.id}`}
                className="card group p-5 transition hover:shadow-glow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-ink group-hover:text-primary">
                      {e.title}
                    </h3>
                    {user.role === "ADMIN" && (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        by {e.organizer.name}
                      </p>
                    )}
                  </div>
                  <span className={`chip ${statusStyles[e.status]}`}>
                    {e.status.toLowerCase()}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                  {e.description || "No description provided."}
                </p>
                <div className="mt-4 flex gap-6 border-t border-[var(--border)] pt-3">
                  <MiniStat label="Scans" value={e._count.scans} />
                  <MiniStat label="Registered" value={e._count.registrations} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      {/* Fixed locale so server and client render identical separators. */}
      <div className="stat-value">{value.toLocaleString("en-US")}</div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-heading text-lg font-bold text-ink">
        {value.toLocaleString("en-US")}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}
