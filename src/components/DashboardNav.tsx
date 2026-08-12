"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/apiClient";

export function DashboardNav({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <span className="hidden font-mono text-xs uppercase tracking-wider text-ink-muted sm:inline">
            {role === "ADMIN" ? "Admin console" : "Organizer workspace"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/events/new" className="btn-primary">
            + New event
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] py-1 pl-3 pr-1">
            <span className="hidden text-sm font-medium text-ink sm:inline">
              {name}
            </span>
            <button
              onClick={logout}
              className="rounded-full bg-neutralbg px-3 py-1 text-xs font-semibold text-ink-muted hover:bg-primary-50 hover:text-primary"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
