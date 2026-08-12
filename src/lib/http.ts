import { NextResponse } from "next/server";
import { HttpError } from "./guards";
import { ZodError } from "zod";

// Wrap an API handler so thrown HttpError / ZodError values become clean JSON
// responses instead of unhandled 500s. Keeps each route focused on its logic.
// A handler may also return a NextResponse directly to control status/body.
export function handle<T>(fn: () => Promise<T>) {
  return fn().then(
    (data) =>
      data instanceof NextResponse ? data : NextResponse.json(data),
    (err: unknown) => {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: err.flatten() },
          { status: 422 }
        );
      }
      console.error(err);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  );
}
