import type { Room } from "./types";

export const FLOORS = 10;
export const MAX_BOOKING = 5;

export const ROOMS_PER_FLOOR: Record<number, number> = {
  1: 10, 2: 10, 3: 10, 4: 10, 5: 10,
  6: 10, 7: 10, 8: 10, 9: 10, 10: 7,
};

function buildRooms(): Room[] {
  const rooms: Room[] = [];
  for (let floor = 1; floor <= FLOORS; floor++) {
    const count = ROOMS_PER_FLOOR[floor];
    for (let position = 1; position <= count; position++) {
      const id = floor === 10 ? 1000 + position : floor * 100 + position;
      rooms.push({ id, floor, position });
    }
  }
  return rooms;
}

export const ALL_ROOMS: readonly Room[] = buildRooms();
export const TOTAL_ROOMS = ALL_ROOMS.length;

export function roomsOnFloor(floor: number): Room[] {
  return ALL_ROOMS.filter((r) => r.floor === floor);
}
