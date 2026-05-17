import {
  ALL_ROOMS,
  TOTAL_ROOMS,
  FLOORS,
  MAX_BOOKING,
  ROOMS_PER_FLOOR,
  roomsOnFloor,
} from "@/lib/hotel";

describe("hotel — constants", () => {
  it("has exactly 97 rooms", () => {
    expect(TOTAL_ROOMS).toBe(97);
    expect(ALL_ROOMS).toHaveLength(97);
  });

  it("has 10 floors", () => {
    expect(FLOORS).toBe(10);
  });

  it("caps a single booking at 5 rooms", () => {
    expect(MAX_BOOKING).toBe(5);
  });

  it("ROOMS_PER_FLOOR sums to 97", () => {
    const total = Object.values(ROOMS_PER_FLOOR).reduce((a, b) => a + b, 0);
    expect(total).toBe(97);
  });

  it("ROOMS_PER_FLOOR: floors 1-9 have 10 rooms each", () => {
    for (let f = 1; f <= 9; f++) {
      expect(ROOMS_PER_FLOOR[f]).toBe(10);
    }
  });

  it("ROOMS_PER_FLOOR: floor 10 has 7 rooms", () => {
    expect(ROOMS_PER_FLOOR[10]).toBe(7);
  });
});

describe("hotel — ALL_ROOMS", () => {
  it("is sorted by floor then position", () => {
    for (let i = 1; i < ALL_ROOMS.length; i++) {
      const prev = ALL_ROOMS[i - 1];
      const cur = ALL_ROOMS[i];
      const inOrder =
        cur.floor > prev.floor ||
        (cur.floor === prev.floor && cur.position > prev.position);
      expect(inOrder).toBe(true);
    }
  });

  it("has unique room IDs", () => {
    const ids = ALL_ROOMS.map((r) => r.id);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });

  it("uses id = floor*100 + position for floors 1-9", () => {
    const lowerFloors = ALL_ROOMS.filter((r) => r.floor < 10);
    for (const r of lowerFloors) {
      expect(r.id).toBe(r.floor * 100 + r.position);
    }
  });

  it("uses id = 1000 + position for floor 10", () => {
    const f10 = ALL_ROOMS.filter((r) => r.floor === 10);
    for (const r of f10) {
      expect(r.id).toBe(1000 + r.position);
    }
  });

  it("floor 1 spans 101..110", () => {
    const f1 = ALL_ROOMS.filter((r) => r.floor === 1).map((r) => r.id);
    expect(f1[0]).toBe(101);
    expect(f1[f1.length - 1]).toBe(110);
    expect(f1).toHaveLength(10);
  });

  it("floor 9 spans 901..910", () => {
    const f9 = ALL_ROOMS.filter((r) => r.floor === 9).map((r) => r.id);
    expect(f9[0]).toBe(901);
    expect(f9[f9.length - 1]).toBe(910);
  });

  it("floor 10 spans 1001..1007", () => {
    const f10 = ALL_ROOMS.filter((r) => r.floor === 10).map((r) => r.id);
    expect(f10[0]).toBe(1001);
    expect(f10[f10.length - 1]).toBe(1007);
    expect(f10).toHaveLength(7);
  });

  it("every room has position in valid range", () => {
    for (const r of ALL_ROOMS) {
      if (r.floor === 10) {
        expect(r.position).toBeGreaterThanOrEqual(1);
        expect(r.position).toBeLessThanOrEqual(7);
      } else {
        expect(r.position).toBeGreaterThanOrEqual(1);
        expect(r.position).toBeLessThanOrEqual(10);
      }
    }
  });

  it("every room has floor in valid range", () => {
    for (const r of ALL_ROOMS) {
      expect(r.floor).toBeGreaterThanOrEqual(1);
      expect(r.floor).toBeLessThanOrEqual(10);
    }
  });
});

describe("hotel — roomsOnFloor()", () => {
  it("returns 10 rooms for floor 1", () => {
    const rooms = roomsOnFloor(1);
    expect(rooms).toHaveLength(10);
    expect(rooms.every((r) => r.floor === 1)).toBe(true);
  });

  it("returns 10 rooms for an arbitrary middle floor (5)", () => {
    const rooms = roomsOnFloor(5);
    expect(rooms).toHaveLength(10);
    expect(rooms[0].id).toBe(501);
    expect(rooms[9].id).toBe(510);
  });

  it("returns 7 rooms for floor 10", () => {
    const rooms = roomsOnFloor(10);
    expect(rooms).toHaveLength(7);
    expect(rooms.every((r) => r.floor === 10)).toBe(true);
  });

  it("returns an empty array for a non-existent floor", () => {
    expect(roomsOnFloor(0)).toEqual([]);
    expect(roomsOnFloor(11)).toEqual([]);
    expect(roomsOnFloor(99)).toEqual([]);
  });

  it("returns rooms ordered by position ascending", () => {
    for (let f = 1; f <= 10; f++) {
      const rooms = roomsOnFloor(f);
      for (let i = 1; i < rooms.length; i++) {
        expect(rooms[i].position).toBeGreaterThan(rooms[i - 1].position);
      }
    }
  });
});
