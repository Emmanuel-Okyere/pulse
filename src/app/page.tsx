import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const user = await getSession();

  return (
    <main className="min-h-screen bg-neutralbg">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-100 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-secondary-100 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="chip bg-primary-50 text-primary-700">
              Attendance you can prove
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
              Tickets tell you who <span className="text-primary">paid</span>.
              <br />
              Pulse tells you who{" "}
              <span className="text-primary">showed up</span>.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
              Create an event, and Pulse hands you a QR code. Attendees scan it,
              register in seconds on a form you designed, and walk away with a
              code they can redeem for whatever perk you promised. You get the
              headcount, the data, and the proof of presence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? "/dashboard" : "/signup"} className="btn-primary">
                Create your first event
              </Link>
              <Link href="/login" className="btn-outline">
                I already have an account
              </Link>
            </div>
          </div>

          {/* Illustrative QR card */}
          <div className="flex items-center justify-center">
            <div className="card w-full max-w-sm p-6">
              <div className="flex items-center justify-between">
                <span className="label">Live event</span>
                <span className="chip bg-secondary-50 text-secondary-800">
                  Published
                </span>
              </div>
              <h3 className="mt-2 font-heading text-xl font-bold text-ink">
                Founders Mixer 2026
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { k: "Scans", v: "1,204" },
                  { k: "Registered", v: "863" },
                  { k: "Redeemed", v: "590" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl bg-neutralbg p-3">
                    <div className="stat-value text-2xl">{s.v}</div>
                    <div className="label mt-1">{s.k}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-4 rounded-xl border border-[var(--border)] p-4">
                <QrGlyph />
                <div>
                  <div className="font-mono text-sm font-semibold text-ink">
                    PLS-7KQ4-M9TX
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">
                    Scan → register → redeem
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Forms you design",
              d: "Collect exactly what each event needs — name and email for one, age and school for another. No two forms have to look alike.",
            },
            {
              t: "Proof of presence",
              d: "Every scan and every registration is logged, so your headcount is grounded in who actually arrived, not who bought a ticket.",
            },
            {
              t: "Perks that pay off",
              d: "Promise free airtime, popcorn, or a raffle entry. Attendees redeem with their code, and you see redemption rates in real time.",
            },
          ].map((f) => (
            <div key={f.t} className="card p-6">
              <h4 className="font-heading text-lg font-bold text-ink">{f.t}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-ink-muted">
          <Logo />
          <span>Built for CSCD 602 — Advanced Software Engineering</span>
        </div>
      </footer>
    </main>
  );
}

function QrGlyph() {
  return (
    <div className="grid h-16 w-16 shrink-0 grid-cols-4 grid-rows-4 gap-0.5 rounded-lg bg-white p-1">
      {[1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1].map((v, i) => (
        <span
          key={i}
          className={`rounded-[2px] ${v ? "bg-ink" : "bg-transparent"}`}
        />
      ))}
    </div>
  );
}
