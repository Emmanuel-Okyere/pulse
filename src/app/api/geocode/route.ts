import { requireUser, HttpError } from "@/lib/guards";
import { handle } from "@/lib/http";

// GET /api/geocode?q=<address> — resolve an address to coordinates using the
// free OpenStreetMap Nominatim service. Signed-in organizers only. This is a
// setup convenience; the primary way to set a venue is "use my location".
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q) throw new HttpError(400, "Enter an address to search.");

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      q
    )}`;
    const res = await fetch(url, {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        "User-Agent": "PulseEventPlatform/1.0 (event registration)",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new HttpError(502, "Address lookup is unavailable right now.");

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (!Array.isArray(data) || data.length === 0) {
      throw new HttpError(404, "No place found for that address.");
    }
    const top = data[0];
    return {
      lat: Number(top.lat),
      lng: Number(top.lon),
      label: top.display_name,
    };
  });
}
