import { travelTime, lexCompare, bookingSpan } from "@/lib/travel";
import type { Room } from "@/lib/types";

const room = (floor: number, position: number): Room => ({
  id: floor === 10 ? 1000 + position : floor * 100 + position,
  floor,
  position,
});

describe("travelTime() — same floor", () => {
  it("returns 0 for the same room", () => {
    const r = room(3, 5);
    expect(travelTime(r, r)).toBe(0);
  });

  it("returns horizontal distance for adjacent rooms", () => {
    expect(travelTime(room(1, 1), room(1, 2))).toBe(1);
  });

  it("returns horizontal distance for non-adjacent rooms", () => {
    expect(travelTime(room(1, 1), room(1, 5))).toBe(4);
    expect(travelTime(room(1, 1), room(1, 10))).toBe(9);
  });

  it("is symmetric", () => {
    expect(travelTime(room(2, 7), room(2, 3))).toBe(4);
    expect(travelTime(room(2, 3), room(2, 7))).toBe(4);
  });

  it("works on floor 10 (which has only 7 rooms)", () => {
    expect(travelTime(room(10, 1), room(10, 7))).toBe(6);
  });
});

describe("travelTime() — different floors", () => {
  it("matches the README example: 102 → 305 = 9 min", () => {
    // (102.pos - 1) + 2*|1-3| + (305.pos - 1) = 1 + 4 + 4 = 9
    expect(travelTime(room(1, 2), room(3, 5))).toBe(9);
  });

  it("returns 2 between adjacent first-rooms on consecutive floors", () => {
    // 101 → 201 = 0 + 2 + 0 = 2
    expect(travelTime(room(1, 1), room(2, 1))).toBe(2);
  });

  it("is symmetric across floors", () => {
    expect(travelTime(room(1, 3), room(5, 8))).toBe(
      travelTime(room(5, 8), room(1, 3)),
    );
  });

  it("computes the longest possible journey (101 → 1007)", () => {
    // (1-1) + 2*9 + (7-1) = 0 + 18 + 6 = 24
    expect(travelTime(room(1, 1), room(10, 7))).toBe(24);
  });

  it("uses absolute floor difference", () => {
    // going from floor 9 to floor 1 = 16 min vertical
    expect(travelTime(room(9, 5), room(1, 5))).toBe(4 + 16 + 4);
  });
});

describe("lexCompare()", () => {
  it("returns 0 for identical rooms", () => {
    expect(lexCompare(room(3, 5), room(3, 5))).toBe(0);
  });

  it("returns negative when first room is on a lower floor", () => {
    expect(lexCompare(room(1, 9), room(2, 1))).toBeLessThan(0);
  });

  it("returns positive when first room is on a higher floor", () => {
    expect(lexCompare(room(5, 1), room(2, 9))).toBeGreaterThan(0);
  });

  it("on the same floor, lower position comes first", () => {
    expect(lexCompare(room(4, 2), room(4, 7))).toBeLessThan(0);
    expect(lexCompare(room(4, 7), room(4, 2))).toBeGreaterThan(0);
  });

  it("sorts rooms correctly when used as a comparator", () => {
    const rooms = [room(3, 1), room(1, 5), room(2, 2), room(1, 1)];
    const sorted = [...rooms].sort(lexCompare);
    expect(sorted.map((r) => r.id)).toEqual([101, 105, 202, 301]);
  });
});

describe("bookingSpan()", () => {
  it("returns 0 for an empty list", () => {
    expect(bookingSpan([])).toBe(0);
  });

  it("returns 0 for a single room", () => {
    expect(bookingSpan([room(2, 3)])).toBe(0);
  });

  it("returns the position diff on a single floor", () => {
    const rooms = [room(1, 1), room(1, 2), room(1, 5)];
    expect(bookingSpan(rooms)).toBe(4);
  });

  it("returns travelTime(first, last) across floors", () => {
    // first = (1,1), last = (3,5) → 0 + 4 + 4 = 8
    const rooms = [room(1, 1), room(2, 3), room(3, 5)];
    expect(bookingSpan(rooms)).toBe(8);
  });

  it("works with unsorted input (sorts internally)", () => {
    const rooms = [room(3, 5), room(1, 1), room(2, 3)];
    expect(bookingSpan(rooms)).toBe(8);
  });
});
