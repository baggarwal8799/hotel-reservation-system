import { pickRooms } from "@/lib/booking";
import { ALL_ROOMS, TOTAL_ROOMS } from "@/lib/hotel";

const ids = (rooms: { id: number }[]) => rooms.map((r) => r.id);

const allIdsExcept = (...keep: number[]): Set<number> => {
  const keepSet = new Set(keep);
  return new Set(ALL_ROOMS.map((r) => r.id).filter((id) => !keepSet.has(id)));
};

describe("pickRooms — input validation", () => {
  it("rejects a booking of 0 rooms", () => {
    const result = pickRooms(0, new Set());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/between 1 and 5/i);
  });

  it("rejects a negative count", () => {
    const result = pickRooms(-3, new Set());
    expect(result.ok).toBe(false);
  });

  it("rejects more than 5 rooms", () => {
    const result = pickRooms(6, new Set());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/between 1 and 5/i);
  });

  it("rejects 100 rooms", () => {
    const result = pickRooms(100, new Set());
    expect(result.ok).toBe(false);
  });
});

describe("pickRooms — capacity guard", () => {
  it("fails when the hotel is fully occupied", () => {
    const occupied = new Set(ALL_ROOMS.map((r) => r.id));
    const result = pickRooms(1, occupied);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Only 0 room/);
  });

  it("fails when only 2 rooms are available and 3 are requested", () => {
    const occupied = allIdsExcept(101, 102);
    const result = pickRooms(3, occupied);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Only 2 room/);
  });
});

describe("pickRooms — single floor (Priorities 1 & 2)", () => {
  it("books the first 4 rooms on floor 1 when the hotel is empty", () => {
    const result = pickRooms(4, new Set());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 102, 103, 104]);
    expect(result.spansMultipleFloors).toBe(false);
    expect(result.travelTime).toBe(3);
  });

  it("books a single room — always the lex-smallest available", () => {
    const result = pickRooms(1, new Set());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101]);
    expect(result.spansMultipleFloors).toBe(false);
    expect(result.travelTime).toBe(0);
  });

  it("matches the README brief: available 101,102,105,106,201,202,203,210,301,302 + 4 rooms ⇒ 101,102,105,106", () => {
    const available = [101, 102, 105, 106, 201, 202, 203, 210, 301, 302];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(4, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 102, 105, 106]);
    expect(result.spansMultipleFloors).toBe(false);
    expect(result.travelTime).toBe(5); // 106 - 101 = 5
  });

  it("picks the smallest-span sliding window when there are gaps", () => {
    // floor 1 available: 101, 102, 103, 105, 107 — book 3.
    // candidate windows of 3: [101,102,103] span 2; [102,103,105] span 3; [103,105,107] span 4.
    const available = [101, 102, 103, 105, 107];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(3, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 102, 103]);
    expect(result.travelTime).toBe(2);
  });

  it("on a span tie, prefers the lower floor", () => {
    // floors 1 and 2 each have exactly [pos1, pos2] available — both span 1. Lower floor wins.
    const available = [101, 102, 201, 202];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(2, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 102]);
    expect(result.travelTime).toBe(1);
  });

  it("on a span tie within the same floor, prefers the lower starting position", () => {
    // floor 1 available: 101, 102, 105, 106 — book 2.
    // (101,102) span 1; (105,106) span 1. Lower start wins.
    const available = [101, 102, 105, 106];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(2, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 102]);
  });

  it("skips floors with fewer than count available rooms", () => {
    // floor 1: 1 available; floor 2: 5 available → must book on floor 2.
    const available = [101, 201, 202, 203, 204, 205];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(5, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([201, 202, 203, 204, 205]);
    expect(result.spansMultipleFloors).toBe(false);
    expect(result.travelTime).toBe(4);
  });

  it("can book 5 rooms entirely on floor 10 (which has 7 rooms)", () => {
    const result = pickRooms(5, new Set());
    expect(result.ok).toBe(true);
    // empty hotel ⇒ floor 1 wins; force floor 10 by occupying everything else.
    const onlyTop = allIdsExcept(1001, 1002, 1003, 1004, 1005);
    const top = pickRooms(5, onlyTop);
    expect(top.ok).toBe(true);
    if (!top.ok) return;
    expect(ids(top.rooms)).toEqual([1001, 1002, 1003, 1004, 1005]);
  });
});

describe("pickRooms — cross floor (Priority 3)", () => {
  it("matches the README brief: only 101,102 on floor 1 and 201,202,203 on floor 2 + 4 rooms ⇒ 101,102,201,202 with travelTime 3", () => {
    const available = [101, 102, 201, 202, 203];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(4, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 102, 201, 202]);
    expect(result.spansMultipleFloors).toBe(true);
    expect(result.travelTime).toBe(3);
  });

  it("picks the pair of floors that minimises combined travel", () => {
    // Available: 101, 110 on floor 1, plus 201 alone on floor 2, and 301 alone on floor 3.
    // No floor has 3 available, so we span.
    // Pairs by travelTime(first, last):
    //   (101, 201) → 0+2+0 = 2; but only 2 in range [101..201]: 101, 110, 201? lex order is 101 < 110 (floor 1) < 201, so all 3 fit.
    //     Wait — 110 is on floor 1, position 10. 110 > 101 lex, 110 < 201 lex. So in lex range [101..201] are: 101, 110, 201. Count = 3. ✓
    //     But the *span* is travelTime(first=101, last=201) = 2.
    //   (101, 301) → 0+4+0 = 4. So (101, 201) wins.
    // Result: rooms = [101, 110, 201], travelTime = 2.
    const available = [101, 110, 201, 301];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(3, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(ids(result.rooms)).toEqual([101, 110, 201]);
    expect(result.spansMultipleFloors).toBe(true);
    expect(result.travelTime).toBe(2);
  });

  it("sets spansMultipleFloors=true when the booking is forced to span", () => {
    const available = [101, 201];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(2, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.spansMultipleFloors).toBe(true);
  });
});

describe("pickRooms — properties", () => {
  it("is deterministic — same inputs produce the same output", () => {
    const occupied = new Set([105, 106, 201, 202]);
    const a = pickRooms(3, occupied);
    const b = pickRooms(3, occupied);
    expect(a).toEqual(b);
  });

  it("returns rooms sorted by (floor, position)", () => {
    const available = [101, 102, 201, 202, 203];
    const occupied = allIdsExcept(...available);
    const result = pickRooms(4, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (let i = 1; i < result.rooms.length; i++) {
      const prev = result.rooms[i - 1];
      const cur = result.rooms[i];
      const inOrder =
        cur.floor > prev.floor ||
        (cur.floor === prev.floor && cur.position > prev.position);
      expect(inOrder).toBe(true);
    }
  });

  it("the requested count is always honoured on success", () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const result = pickRooms(n, new Set());
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.rooms).toHaveLength(n);
    }
  });

  it("never returns an occupied room", () => {
    const occupied = new Set([101, 102, 103]);
    const result = pickRooms(5, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const r of result.rooms) {
      expect(occupied.has(r.id)).toBe(false);
    }
  });

  it("never returns duplicate rooms", () => {
    const result = pickRooms(5, new Set());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const set = new Set(result.rooms.map((r) => r.id));
    expect(set.size).toBe(result.rooms.length);
  });

  it("the reported travelTime equals the span between first and last picked room", () => {
    const result = pickRooms(5, new Set());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const first = result.rooms[0];
    const last = result.rooms[result.rooms.length - 1];
    if (first.floor === last.floor) {
      expect(result.travelTime).toBe(last.position - first.position);
    } else {
      expect(result.travelTime).toBe(
        first.position - 1 + 2 * Math.abs(first.floor - last.floor) + (last.position - 1),
      );
    }
  });

  it("succeeds when exactly the requested count is available", () => {
    // leave exactly 3 available, request 3
    const occupied = allIdsExcept(105, 201, 307);
    const result = pickRooms(3, occupied);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rooms).toHaveLength(3);
  });
});

describe("pickRooms — total-occupancy sanity", () => {
  it("can sequentially book the whole hotel by repeated calls", () => {
    let occupied = new Set<number>();
    let booked = 0;
    while (true) {
      const remaining = TOTAL_ROOMS - occupied.size;
      if (remaining === 0) break;
      const n = Math.min(5, remaining);
      const result = pickRooms(n, occupied);
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      for (const r of result.rooms) occupied.add(r.id);
      booked += result.rooms.length;
    }
    expect(booked).toBe(TOTAL_ROOMS);
    expect(occupied.size).toBe(TOTAL_ROOMS);
  });
});
