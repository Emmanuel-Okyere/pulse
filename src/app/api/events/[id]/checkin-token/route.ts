import { requireEventAccess } from "@/lib/guards";
import { handle } from "@/lib/http";
import { signCheckinToken, CHECKIN_ROTATE_SECONDS } from "@/lib/checkin";

type Params = { params: { id: string } };

// Mint a fresh, short-lived check-in token for the live entrance display.
// Organizer / manager / admin only — this is what proves a scan is recent.
export async function GET(_req: Request, { params }: Params) {
  return handle(async () => {
    const { event } = await requireEventAccess(params.id);
    const token = signCheckinToken(event.id);
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
      token,
      url: `${base}/r/${event.slug}?t=${token}`,
      rotateSeconds: CHECKIN_ROTATE_SECONDS,
    };
  });
}
