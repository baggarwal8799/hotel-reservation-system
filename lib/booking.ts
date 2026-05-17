import { ALL_ROOMS, FLOORS, MAX_BOOKING } from "./hotel";
import { lexCompare, travelTime } from "./travel";
import type { BookingResult, Room } from "./types";

export function pickRooms(
  count: number,
  occupied: ReadonlySet<number>,
): BookingResult {
  if (count < 1 || count > MAX_BOOKING) {
    return { ok: false, reason: `Booking size must be between 1 and ${MAX_BOOKING}.` };
  }

  const available = ALL_ROOMS.filter((r) => !occupied.has(r.id));
  if (available.length < count) {
    return { ok: false, reason: `Only ${available.length} room(s) available.` };
  }

  // Priority 1 & 2: single floor.
  const sameFloor = pickSingleFloor(available, count);
  if (sameFloor) {
    return {
      ok: true,
      rooms: sameFloor.rooms,
      travelTime: sameFloor.span,
      spansMultipleFloors: false,
    };
  }

  // Priority 3: span multiple floors.
  const crossFloor = pickCrossFloor(available, count);
  return {
    ok: true,
    rooms: crossFloor.rooms,
    travelTime: crossFloor.span,
    spansMultipleFloors: true,
  };
}

interface Pick {
  rooms: Room[];
  span: number;
}

function pickSingleFloor(available: Room[], count: number): Pick | null {
  let best: Pick | null = null;

  for (let floor = 1; floor <= FLOORS; floor++) {
    const onFloor = available
      .filter((r) => r.floor === floor)
      .sort((a, b) => a.position - b.position);

    if (onFloor.length < count) continue;

    for (let i = 0; i + count <= onFloor.length; i++) {
      const window = onFloor.slice(i, i + count);
      const span = window[count - 1].position - window[0].position;
      if (!best || span < best.span || (span === best.span && betterStart(window, best.rooms))) {
        best = { rooms: window, span };
      }
    }
  }

  return best;
}

function pickCrossFloor(available: Room[], count: number): Pick {
  const sorted = [...available].sort(lexCompare);

  let bestSpan = Infinity;
  let bestI = 0;
  let bestJ = count - 1;

  for (let i = 0; i <= sorted.length - count; i++) {
    for (let j = i + count - 1; j < sorted.length; j++) {
      const span = travelTime(sorted[i], sorted[j]);
      if (span < bestSpan) {
        bestSpan = span;
        bestI = i;
        bestJ = j;
      }
    }
  }

  // Take first + last + the (count-2) lex-smallest in between.
  const rooms: Room[] = [sorted[bestI]];
  for (let k = bestI + 1; k < bestJ && rooms.length < count - 1; k++) {
    rooms.push(sorted[k]);
  }
  rooms.push(sorted[bestJ]);
  rooms.sort(lexCompare);

  return { rooms, span: bestSpan };
}

function betterStart(candidate: Room[], current: Room[]): boolean {
  return lexCompare(candidate[0], current[0]) < 0;
}
