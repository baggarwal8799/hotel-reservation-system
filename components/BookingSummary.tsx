import type { BookingResult } from "@/lib/types";

interface Props {
  result: BookingResult | null;
}

export function BookingSummary({ result }: Props) {
  if (!result) {
    return (
      <div className="card p-6">
        <p className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wider mb-2">
          Last booking
        </p>
        <p className="text-sm text-[var(--ink-muted)]">No booking yet.</p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="card p-6" style={{ borderColor: "var(--occupied-border)", background: "var(--occupied-bg)" }}>
        <p className="text-xs font-medium text-[var(--occupied)] uppercase tracking-wider mb-2">
          Booking failed
        </p>
        <p className="text-sm text-[var(--occupied)]">{result.reason}</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-medium text-[var(--ink)] uppercase tracking-wider">
          Booking confirmed
        </p>
        <p className="text-[11px] text-[var(--ink-muted)]">
          {result.spansMultipleFloors ? "Multi-floor" : "Single floor"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {result.rooms.map((r) => (
          <span
            key={r.id}
            className="font-mono text-[11px] px-2 py-1 rounded bg-[var(--booked)] text-[var(--booked-fg)]"
          >
            {r.id}
          </span>
        ))}
      </div>

      <div className="flex items-baseline justify-between pt-3 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--ink-muted)]">Travel time (first → last)</span>
        <span className="font-mono text-base font-semibold text-[var(--ink)]">{result.travelTime} min</span>
      </div>
    </div>
  );
}
