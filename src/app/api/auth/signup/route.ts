import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  return handle(async () => {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with this email already exists.");

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email,
        passwordHash: await hashPassword(body.password),
        role: "ORGANIZER",
      },
    });

    const session = { id: user.id, email: user.email, name: user.name, role: user.role };
    setSessionCookie(signToken(session));
    return { user: session };
  });
}
