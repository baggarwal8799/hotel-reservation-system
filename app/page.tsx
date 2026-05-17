"use client";

import { useMemo, useState } from "react";
import { Hotel } from "@/components/Hotel";
import { ControlPanel } from "@/components/ControlPanel";
import { BookingSummary } from "@/components/BookingSummary";
import { pickRooms } from "@/lib/booking";
import { randomOccupancy } from "@/lib/occupancy";
import { TOTAL_ROOMS } from "@/lib/hotel";
import type { BookingResult } from "@/lib/types";

export default function Home() {
  const [occupied, setOccupied] = useState<Set<number>>(new Set());
  const [lastResult, setLastResult] = useState<BookingResult | null>(null);

  const bookedIds = useMemo<Set<number>>(() => {
    if (!lastResult || !lastResult.ok) return new Set();
    return new Set(lastResult.rooms.map((r) => r.id));
  }, [lastResult]);

  function handleBook(count: number) {
    const result = pickRooms(count, occupied);
    setLastResult(result);
    if (result.ok) {
      const next = new Set(occupied);
      result.rooms.forEach((r) => next.add(r.id));
      setOccupied(next);
    }
  }

  function handleRandom(percent: number) {
    setOccupied(randomOccupancy(percent));
    setLastResult(null);
  }

  function handleReset() {
    setOccupied(new Set());
    setLastResult(null);
  }

  const availableCount = TOTAL_ROOMS - occupied.size;
  const occupancyPercent = Math.round((occupied.size / TOTAL_ROOMS) * 100);

  return (
    <main className="min-h-screen px-5 md:px-8 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--ink)] tracking-tight">
            Hotel reservation system
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1">
            97 rooms · 10 floors · books up to 5 rooms with minimum travel time
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-6 text-xs">
          <Legend color="var(--available-border)" bg="var(--available-bg)" label="Available" />
          <Legend color="var(--occupied-border)" bg="var(--occupied-bg)" label="Occupied" />
          <Legend color="var(--booked)" bg="var(--booked)" label="Booked" filled />
          <div className="ml-auto flex items-center gap-4 text-[var(--ink-muted)]">
            <Stat label="Available" value={`${availableCount}`} />
            <span className="h-4 w-px bg-[var(--border)]" />
            <Stat label="Occupied" value={`${occupied.size}`} />
            <span className="h-4 w-px bg-[var(--border)]" />
            <Stat label="Load" value={`${occupancyPercent}%`} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="overflow-x-auto">
            <Hotel occupied={occupied} booked={bookedIds} />
          </div>
          <div className="flex flex-col gap-4">
            <ControlPanel onBook={handleBook} onRandom={handleRandom} onReset={handleReset} />
            <BookingSummary result={lastResult} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Legend({
  color,
  bg,
  label,
  filled,
}: {
  color: string;
  bg: string;
  label: string;
  filled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-[var(--ink-soft)]">
      <span
        className="w-3.5 h-3.5 rounded border"
        style={{
          background: filled ? color : bg,
          borderColor: color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[var(--ink)] text-sm font-semibold">{value}</span>
      <span className="text-[11px] uppercase tracking-wider">{label}</span>
    </span>
  );
}
