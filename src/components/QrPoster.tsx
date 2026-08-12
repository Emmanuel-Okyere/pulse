"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// Renders the event's registration URL as a QR code on a canvas, overlays the
// organizer's logo in the centre, and offers a PNG download for printing.
export function QrPoster({
  url,
  logoData,
  title,
}: {
  url: string;
  logoData: string | null;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(
      canvas,
      url,
      {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "H", // high, so the centre logo does not break it
        color: { dark: "#121212", light: "#ffffff" },
      },
      (err) => {
        if (err) return;
        if (!logoData) {
          setReady(true);
          return;
        }
        // Draw the logo on a white rounded badge in the middle.
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = new Image();
        img.onload = () => {
          const size = canvas.width * 0.22;
          const x = (canvas.width - size) / 2;
          const y = (canvas.height - size) / 2;
          const pad = size * 0.12;
          ctx.fillStyle = "#ffffff";
          roundRect(ctx, x - pad, y - pad, size + pad * 2, size + pad * 2, 8);
          ctx.fill();
          ctx.drawImage(img, x, y, size, size);
          setReady(true);
        };
        img.onerror = () => setReady(true);
        img.src = logoData;
      }
    );
  }, [url, logoData]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-card">
        <canvas ref={canvasRef} className="h-auto w-full max-w-[280px]" />
      </div>
      <button onClick={download} disabled={!ready} className="btn-outline mt-4">
        ↓ Download QR (PNG)
      </button>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
