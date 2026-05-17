import type { Room } from "./types";

export function travelTime(a: Room, b: Room): number {
  if (a.floor === b.floor) {
    return Math.abs(a.position - b.position);
  }
  return (a.position - 1) + 2 * Math.abs(a.floor - b.floor) + (b.position - 1);
}

export function lexCompare(a: Room, b: Room): number {
  if (a.floor !== b.floor) return a.floor - b.floor;
  return a.position - b.position;
}

export function bookingSpan(rooms: Room[]): number {
  if (rooms.length <= 1) return 0;
  const sorted = [...rooms].sort(lexCompare);
  return travelTime(sorted[0], sorted[sorted.length - 1]);
}
