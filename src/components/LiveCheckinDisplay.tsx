"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/apiClient";
import { Logo } from "@/components/Logo";

// Kiosk screen shown at the entrance. It fetches a fresh signed check-in token
// and rotates the QR on a fixed cadence, so a photographed or forwarded code
// stops working within a minute.
export function LiveCheckinDisplay({
  eventId,
  title,
  venue,
}: {
  eventId: string;
  title: string;
  venue: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotateRef = useRef(60);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const { url, rotateSeconds } = await api<{ url: string; rotateSeconds: number }>(
        `/api/events/${eventId}/checkin-token`
      );
      rotateRef.current = rotateSeconds;
      setSecondsLeft(rotateSeconds);
      setError(null);
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 460,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#121212", light: "#ffffff" },
        });
      }
    } catch {
      setError("Could not load the check-in code. Check the connection.");
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          refresh();
          return rotateRef.current;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-10 text-white">
      <div className="mb-8 [&_span]:text-white">
        <Logo />
      </div>
      <h1 className="text-center font-heading text-3xl font-extrabold sm:text-4xl">
        {title}
      </h1>
      {venue && <p className="mt-1 text-white/60">{venue}</p>}
      <p className="mt-6 font-mono text-sm uppercase tracking-widest text-secondary">
        Scan to register
      </p>

      <div className="mt-4 rounded-3xl bg-white p-6 shadow-glow">
        <canvas ref={canvasRef} className="h-auto w-[320px] sm:w-[420px]" />
      </div>

      {error ? (
        <p className="mt-6 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : (
        <p className="mt-6 text-sm text-white/60">
          This code refreshes in{" "}
          <span className="font-mono font-semibold text-white">{secondsLeft}s</span>{" "}
          — screenshots won’t work.
        </p>
      )}
    </main>
  );
}
