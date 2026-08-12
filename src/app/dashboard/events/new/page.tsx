import Link from "next/link";
import { EventEditor } from "@/components/EventEditor";

export default function NewEventPage() {
  return (
    <div>
      <Link href="/dashboard" className="text-sm text-ink-muted hover:text-primary">
        ← Back to events
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink">
        Create an event
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Design the registration form, add any benefits, then create the event to
        get its QR code.
      </p>
      <div className="mt-6">
        <EventEditor />
      </div>
    </div>
  );
}
