import { getSession } from "@/lib/auth";
import { handle } from "@/lib/http";

export async function GET() {
  return handle(async () => {
    const user = await getSession();
    return { user };
  });
}
