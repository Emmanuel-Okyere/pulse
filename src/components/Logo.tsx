// The Pulse wordmark — a small waveform glyph plus the name.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <rect width="26" height="26" rx="7" fill="#5D3FD3" />
        <path
          d="M5 13.5h3l2-5 3 9 2.5-6 1.8 2h3.7"
          stroke="#00F5FF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-heading text-lg font-extrabold tracking-tight text-ink">
        Pulse
      </span>
    </span>
  );
}
