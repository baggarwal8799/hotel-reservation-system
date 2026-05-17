import { ALL_ROOMS } from "./hotel";

export function randomOccupancy(percent: number): Set<number> {
  const ratio = Math.min(1, Math.max(0, percent / 100));
  const target = Math.round(ALL_ROOMS.length * ratio);
  const ids = ALL_ROOMS.map((r) => r.id);

  // Fisher-Yates shuffle.
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return new Set(ids.slice(0, target));
}
