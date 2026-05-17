import { randomOccupancy } from "@/lib/occupancy";
import { ALL_ROOMS, TOTAL_ROOMS } from "@/lib/hotel";

const VALID_IDS = new Set(ALL_ROOMS.map((r) => r.id));

describe("randomOccupancy()", () => {
  it("returns an empty set at 0%", () => {
    const set = randomOccupancy(0);
    expect(set).toBeInstanceOf(Set);
    expect(set.size).toBe(0);
  });

  it("returns every room at 100%", () => {
    const set = randomOccupancy(100);
    expect(set.size).toBe(TOTAL_ROOMS);
    for (const id of VALID_IDS) {
      expect(set.has(id)).toBe(true);
    }
  });

  it("returns approximately half the rooms at 50%", () => {
    const set = randomOccupancy(50);
    // Math.round(97 * 0.5) = 49 (half-up)
    expect(set.size).toBe(Math.round(TOTAL_ROOMS * 0.5));
  });

  it("returns about a quarter of the rooms at 25%", () => {
    const set = randomOccupancy(25);
    expect(set.size).toBe(Math.round(TOTAL_ROOMS * 0.25));
  });

  it("clamps negative percentages to 0", () => {
    const set = randomOccupancy(-50);
    expect(set.size).toBe(0);
  });

  it("clamps percentages above 100 to 100", () => {
    const set = randomOccupancy(150);
    expect(set.size).toBe(TOTAL_ROOMS);
  });

  it("only returns valid room IDs", () => {
    const set = randomOccupancy(70);
    for (const id of set) {
      expect(VALID_IDS.has(id)).toBe(true);
    }
  });

  it("never returns duplicates (it is a Set)", () => {
    const set = randomOccupancy(60);
    // Set guarantees uniqueness; double-check size matches a manually-built unique list.
    const arr = Array.from(set);
    expect(new Set(arr).size).toBe(arr.length);
  });

  it("produces different selections on repeated calls (probabilistic)", () => {
    // At 50% occupancy across 97 rooms, two independent shuffles producing the
    // *exact* same selection has probability 1 / C(97, 49) ≈ 10^-28. Safe.
    const a = randomOccupancy(50);
    const b = randomOccupancy(50);
    const equal =
      a.size === b.size && Array.from(a).every((id) => b.has(id));
    expect(equal).toBe(false);
  });

  it("a single room (≈1%) returns 1 room", () => {
    const set = randomOccupancy(1);
    expect(set.size).toBe(Math.round(TOTAL_ROOMS * 0.01));
  });
});
