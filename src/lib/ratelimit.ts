import { prisma } from "./prisma";
import { HttpError } from "./guards";

// Best-effort client IP from the proxy headers Vercel and most hosts set.
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Fixed-window rate limiter backed by a shared table, so the limit holds across
// serverless instances. Each (action, client, window) is one counter row keyed
// by the window index; an over-limit call throws HttpError 429. Failures in the
// limiter itself never block the request — availability beats strictness here.
export async function rateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowMs = 60_000
): Promise<void> {
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `${action}:${identifier}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowMs);

  try {
    const row = await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    });
    if (row.count > limit) {
      throw new HttpError(429, "Too many attempts. Please wait a minute and try again.");
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    // A limiter/database hiccup must not take down the endpoint.
    console.error("rate limiter error", e);
  }

  // Opportunistically prune expired counters (roughly 2% of calls).
  if (Math.random() < 0.02) {
    prisma.rateLimit
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch(() => {});
  }
}
