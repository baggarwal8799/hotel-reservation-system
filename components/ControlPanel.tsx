"use client";

import { useState } from "react";
import { MAX_BOOKING } from "@/lib/hotel";

interface Props {
  onBook: (count: number) => void;
  onRandom: (percent: number) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function ControlPanel({ onBook, onRandom, onReset, disabled }: Props) {
  const [count, setCount] = useState(3);
  const [percent, setPercent] = useState(40);

  return (
    <div className="card p-6 flex flex-col gap-6">
      <section>
        <label className="block text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wider mb-2">
          Rooms to book
        </label>
        <div className="flex items-stretch gap-2">
          <div className="flex items-stretch border border-[var(--border-strong)] rounded-md overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-9 text-[var(--ink-soft)] hover:bg-[var(--bg)] transition-colors"
              aria-label="decrease"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={MAX_BOOKING}
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isFinite(v)) setCount(Math.min(MAX_BOOKING, Math.max(1, v)));
              }}
              className="w-12 text-center font-mono text-sm bg-white focus:outline-none border-x border-[var(--border-strong)]"
            />
            <button
              type="button"
              onClick={() => setCount((c) => Math.min(MAX_BOOKING, c + 1))}
              className="w-9 text-[var(--ink-soft)] hover:bg-[var(--bg)] transition-colors"
              aria-label="increase"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onBook(count)}
            disabled={disabled}
            className="flex-1 bg-[var(--accent)] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[var(--accent-deep)] active:translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Book rooms
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[var(--ink-muted)]">Max {MAX_BOOKING} rooms per booking.</p>
      </section>

      <div className="h-px bg-[var(--border)]" />

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <label className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wider">
            Random occupancy
          </label>
          <span className="font-mono text-sm text-[var(--ink)]">{percent}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => setPercent(parseInt(e.target.value, 10))}
          style={{ ['--val' as string]: `${percent}%` }}
          className="w-full mb-3"
        />
        <button
          type="button"
          onClick={() => onRandom(percent)}
          className="w-full bg-white border border-[var(--border-strong)] text-[var(--ink)] text-sm font-medium px-4 py-2 rounded-md hover:bg-[var(--bg)] active:translate-y-px transition-all"
        >
          Generate
        </button>
      </section>

      <button
        type="button"
        onClick={onReset}
        className="text-xs text-[var(--ink-muted)] hover:text-[var(--occupied)] underline-offset-4 hover:underline self-center"
      >
        Reset everything
      </button>
    </div>
  );
}
