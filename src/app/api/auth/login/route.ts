import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  return handle(async () => {
    // Throttle password guessing per client IP.
    await rateLimit("login", clientIp(req), 10);

    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    // Same message whether the email is unknown or the password is wrong, so we
    // do not leak which accounts exist.
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const session = { id: user.id, email: user.email, name: user.name, role: user.role };
    setSessionCookie(signToken(session));
    return { user: session };
  });
}
