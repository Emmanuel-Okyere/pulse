import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/http";
import { HttpError } from "@/lib/guards";
import { generateRegistrationCode } from "@/lib/codes";
import { formSchemaArray, validateSubmission, type FormField } from "@/lib/formSchema";

const schema = z.object({
  values: z.record(z.string(), z.unknown()),
});

type Params = { params: { slug: string } };

// Public endpoint: submit a registration for an event.
export async function POST(req: Request, { params }: Params) {
  return handle(async () => {
    const event = await prisma.event.findUnique({ where: { slug: params.slug } });
    if (!event) throw new HttpError(404, "This event link is not valid.");
    if (event.status !== "PUBLISHED") {
      throw new HttpError(410, "Registration for this event is not open.");
    }

    const { values } = schema.parse(await req.json());
    const fields = formSchemaArray.parse(event.formSchema) as FormField[];

    const result = validateSubmission(fields, values);
    if (!result.ok) {
      // Structured per-field errors so the form can highlight each input.
      return NextResponse.json({ fieldErrors: result.errors }, { status: 422 });
    }

    // Only issue a code when the organizer enabled them for this event.
    let code: string | null = null;
    if (event.codesEnabled) {
      // Retry a couple of times in the (astronomically unlikely) event of a
      // code collision on the unique index.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const created = await prisma.registration.create({
            data: {
              eventId: event.id,
              code: generateRegistrationCode(),
              data: result.data,
            },
          });
          code = created.code;
          break;
        } catch (e) {
          if (attempt === 2) throw e;
        }
      }
    } else {
      await prisma.registration.create({
        data: { eventId: event.id, data: result.data },
      });
    }

    return {
      code, // null when codes are disabled
      codesEnabled: event.codesEnabled,
      benefits: event.benefits,
      eventTitle: event.title,
      confirmationTitle: event.confirmationTitle,
      confirmationMessage: event.confirmationMessage,
    };
  });
}
