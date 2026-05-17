import { Room } from "./Room";
import { FLOORS, roomsOnFloor } from "@/lib/hotel";

interface Props {
  occupied: ReadonlySet<number>;
  booked: ReadonlySet<number>;
}

export function Hotel({ occupied, booked }: Props) {
  const floors: number[] = [];
  for (let f = FLOORS; f >= 1; f--) floors.push(f);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5 text-xs text-[var(--ink-muted)]">
        <span className="uppercase tracking-wider">Building</span>
        <span className="font-mono">stairs · lift on left</span>
      </div>

      <div className="flex items-stretch gap-3">
        {/* floor numbers */}
        <div className="flex flex-col gap-[3px]">
          {floors.map((f) => (
            <div
              key={f}
              className="h-9 w-6 flex items-center justify-end font-mono text-[11px] tabular-nums text-[var(--ink-muted)]"
            >
              {f.toString().padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* shaft */}
        <div className="relative w-5 self-stretch">
          {/* the rail */}
          <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-px bg-[var(--border-strong)]" />
          {/* floor stop markers */}
          <div className="relative flex flex-col gap-[3px]">
            {floors.map((f) => (
              <div key={f} className="h-9 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[var(--surface)] ring-1 ring-[var(--ink-muted)]" />
              </div>
            ))}
          </div>
        </div>

        {/* rooms */}
        <div className="flex flex-col gap-[3px]">
          {floors.map((f) => (
            <div key={f} className="flex gap-[3px]">
              {roomsOnFloor(f).map((r) => {
                const state: "available" | "occupied" | "booked" = booked.has(r.id)
                  ? "booked"
                  : occupied.has(r.id)
                  ? "occupied"
                  : "available";
                return <Room key={r.id} room={r} state={state} />;
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-dashed border-[var(--border)] flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
        <span>Lobby</span>
        <span>Ground</span>
      </div>
    </div>
  );
}
