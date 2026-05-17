import type { Room as RoomType } from "@/lib/types";

interface Props {
  room: RoomType;
  state: "available" | "occupied" | "booked";
}

const STYLES: Record<Props["state"], string> = {
  available:
    "bg-[var(--available-bg)] text-[var(--available)] border-[var(--available-border)] hover:border-[var(--available)]",
  occupied:
    "bg-[var(--occupied-bg)] text-[var(--occupied)] border-[var(--occupied-border)]",
  booked:
    "bg-[var(--booked)] text-[var(--booked-fg)] border-[var(--booked)] shadow-[0_0_0_3px_var(--booked-halo)]",
};

export function Room({ room, state }: Props) {
  return (
    <div
      className={`w-[52px] h-9 flex items-center justify-center rounded-md border font-mono text-[11px] font-medium tracking-tight transition-colors ${STYLES[state]}`}
      title={`Room ${room.id} — ${state}`}
    >
      {room.id}
    </div>
  );
}
