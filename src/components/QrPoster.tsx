"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// Renders the event's registration URL as a QR code on a canvas, optionally
// overlays the organizer's logo in the centre, and offers PNG and PDF downloads
// for printing.
export function QrPoster({
  url,
  logoData,
  title,
  embedLogo = true,
}: {
  url: string;
  logoData: string | null;
  title: string;
  embedLogo?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [makingPdf, setMakingPdf] = useState(false);

  const showLogo = Boolean(logoData) && embedLogo;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setReady(false);

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
        if (!showLogo) {
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
        img.src = logoData as string;
      }
    );
  }, [url, logoData, showLogo]);

  const fileBase = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event";

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${fileBase}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function downloadPdf() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setMakingPdf(true);
    try {
      // Load jsPDF only when a PDF is actually requested.
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const qrSize = 320;
      const x = (pageW - qrSize) / 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(title, pageW / 2, 90, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(110);
      doc.text("Scan to register your attendance", pageW / 2, 116, {
        align: "center",
      });

      doc.addImage(canvas.toDataURL("image/png"), "PNG", x, 150, qrSize, qrSize);

      doc.setTextColor(140);
      doc.setFontSize(10);
      doc.text(url, pageW / 2, 150 + qrSize + 28, { align: "center" });

      doc.save(`${fileBase}-qr.pdf`);
    } finally {
      setMakingPdf(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-card">
        <canvas ref={canvasRef} className="h-auto w-full max-w-[280px]" />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={downloadPng} disabled={!ready} className="btn-outline">
          ↓ PNG
        </button>
        <button
          onClick={downloadPdf}
          disabled={!ready || makingPdf}
          className="btn-outline"
        >
          {makingPdf ? "Preparing…" : "↓ PDF"}
        </button>
      </div>
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
