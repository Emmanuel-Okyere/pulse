import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/guards";
import { handle } from "@/lib/http";

type Params = { params: { id: string } };

// Aggregate scan / registration / redemption metrics for an event, plus a
// day-by-day time series for the dashboard chart.
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const { event } = await requireEventAccess(params.id);

    const [scans, registrations, redeemed, regRows, scanRows] = await Promise.all([
      prisma.scanEvent.count({ where: { eventId: event.id } }),
      prisma.registration.count({ where: { eventId: event.id } }),
      prisma.registration.count({ where: { eventId: event.id, redeemed: true } }),
      prisma.registration.findMany({
        where: { eventId: event.id },
        select: { createdAt: true },
      }),
      prisma.scanEvent.findMany({
        where: { eventId: event.id },
        select: { createdAt: true },
      }),
    ]);

    // Build a per-day series covering both scans and registrations.
    const byDay = new Map<string, { scans: number; registrations: number }>();
    const bump = (d: Date, key: "scans" | "registrations") => {
      const day = d.toISOString().slice(0, 10);
      const row = byDay.get(day) ?? { scans: 0, registrations: 0 };
      row[key] += 1;
      byDay.set(day, row);
    };
    scanRows.forEach((r) => bump(r.createdAt, "scans"));
    regRows.forEach((r) => bump(r.createdAt, "registrations"));

    const series = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day, ...v }));

    const conversion = scans > 0 ? Math.round((registrations / scans) * 100) : 0;
    const redemptionRate =
      registrations > 0 ? Math.round((redeemed / registrations) * 100) : 0;

    return {
      totals: { scans, registrations, redeemed, conversion, redemptionRate },
      series,
    };
  });
}
