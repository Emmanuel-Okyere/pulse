"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { api, ApiError } from "@/lib/apiClient";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const path = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup ? { name, email, password } : { email, password };
      await api(path, { method: "POST", body: JSON.stringify(payload) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unexpected error.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-neutralbg md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink md:block">
        <div className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo className="[&_span]:text-white" />
          <div>
            <h2 className="font-heading text-3xl font-extrabold leading-tight text-white">
              Prove who showed up — not just who paid.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Design a registration form, print a QR code, and watch scans,
              sign-ups and redemptions land on your dashboard as the doors open.
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-secondary">
            Kinetic Pulse
          </span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
            {isSignup ? "Create your organizer account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {isSignup
              ? "Set up events and start tracking real attendance."
              : "Sign in to manage your events."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <div>
                <label className="label">Full name</label>
                <input
                  className="input mt-1.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Ama Owusu"
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className="input mt-1.5"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input mt-1.5"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 8 : 1}
                placeholder="••••••••"
              />
              {isSignup && (
                <p className="mt-1.5 text-xs text-ink-muted">
                  At least 8 characters.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-muted">
            {isSignup ? (
              <>
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-primary">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/signup" className="font-semibold text-primary">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
