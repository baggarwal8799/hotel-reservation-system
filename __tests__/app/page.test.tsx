import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { BookingResult } from "@/lib/types";

// ---- Mocks ----------------------------------------------------------------

jest.mock("@/lib/hotel", () => ({
  TOTAL_ROOMS: 97,
  FLOORS: 10,
  MAX_BOOKING: 5,
}));

const mockPickRooms = jest.fn();
jest.mock("@/lib/booking", () => ({
  pickRooms: (...args: unknown[]) => mockPickRooms(...args),
}));

const mockRandomOccupancy = jest.fn();
jest.mock("@/lib/occupancy", () => ({
  randomOccupancy: (...args: unknown[]) => mockRandomOccupancy(...args),
}));

jest.mock("@/components/Hotel", () => ({
  __esModule: true,
  Hotel: ({ occupied, booked }: { occupied: Set<number>; booked: Set<number> }) => (
    <div
      data-testid="hotel"
      data-occupied={Array.from(occupied).sort((a, b) => a - b).join(",")}
      data-booked={Array.from(booked).sort((a, b) => a - b).join(",")}
    />
  ),
}));

jest.mock("@/components/ControlPanel", () => ({
  __esModule: true,
  ControlPanel: ({
    onBook,
    onRandom,
    onReset,
  }: {
    onBook: (n: number) => void;
    onRandom: (p: number) => void;
    onReset: () => void;
  }) => (
    <div data-testid="control-panel">
      <button onClick={() => onBook(3)}>mock-book</button>
      <button onClick={() => onRandom(40)}>mock-random</button>
      <button onClick={() => onReset()}>mock-reset</button>
    </div>
  ),
}));

jest.mock("@/components/BookingSummary", () => ({
  __esModule: true,
  BookingSummary: ({ result }: { result: BookingResult | null }) => (
    <div data-testid="summary">
      {result === null
        ? "none"
        : result.ok
        ? `ok:${result.rooms.map((r) => r.id).join(",")}`
        : `fail:${result.reason}`}
    </div>
  ),
}));

// import AFTER mocks so they take effect
import Home from "@/app/page";

beforeEach(() => {
  jest.clearAllMocks();
});

// ---- Tests ----------------------------------------------------------------

describe("<Home /> — initial render", () => {
  it("renders the page heading and one-liner", () => {
    render(<Home />);
    expect(screen.getByText(/Hotel reservation system/i)).toBeInTheDocument();
    expect(screen.getByText(/97 rooms · 10 floors/i)).toBeInTheDocument();
  });

  it("shows all three legend swatches", () => {
    render(<Home />);
    // "Available" and "Occupied" appear in BOTH the legend and the stats strip,
    // so use getAllByText and assert at least one of each.
    expect(screen.getAllByText("Available").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Occupied").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Booked")).toBeInTheDocument();
  });

  it("renders the stats strip with initial values (97 / 0 / 0%)", () => {
    render(<Home />);
    expect(screen.getByText("97")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders the mocked child components", () => {
    render(<Home />);
    expect(screen.getByTestId("hotel")).toBeInTheDocument();
    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByTestId("summary")).toHaveTextContent("none");
  });

  it("starts with empty occupied/booked sets passed to Hotel", () => {
    render(<Home />);
    const hotel = screen.getByTestId("hotel");
    expect(hotel).toHaveAttribute("data-occupied", "");
    expect(hotel).toHaveAttribute("data-booked", "");
  });
});

describe("<Home /> — booking flow", () => {
  it("adds rooms to occupied + sets last result on a successful booking", () => {
    const successful: BookingResult = {
      ok: true,
      rooms: [
        { id: 101, floor: 1, position: 1 },
        { id: 102, floor: 1, position: 2 },
        { id: 103, floor: 1, position: 3 },
      ],
      travelTime: 2,
      spansMultipleFloors: false,
    };
    mockPickRooms.mockReturnValueOnce(successful);
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    expect(mockPickRooms).toHaveBeenCalledWith(3, expect.any(Set));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-occupied", "101,102,103");
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "101,102,103");
    expect(screen.getByTestId("summary")).toHaveTextContent("ok:101,102,103");
  });

  it("does NOT modify occupied on a failed booking, but does set the result", () => {
    const failure: BookingResult = { ok: false, reason: "Only 0 room(s) available." };
    mockPickRooms.mockReturnValueOnce(failure);
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-occupied", "");
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "");
    expect(screen.getByTestId("summary")).toHaveTextContent("fail:Only 0 room(s) available.");
  });

  it("accumulates occupancy across multiple successful bookings", () => {
    mockPickRooms
      .mockReturnValueOnce({
        ok: true,
        rooms: [{ id: 101, floor: 1, position: 1 }],
        travelTime: 0,
        spansMultipleFloors: false,
      })
      .mockReturnValueOnce({
        ok: true,
        rooms: [{ id: 201, floor: 2, position: 1 }],
        travelTime: 0,
        spansMultipleFloors: false,
      });
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    fireEvent.click(screen.getByText("mock-book"));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-occupied", "101,201");
    // booked set reflects only the most recent booking
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "201");
  });

  it("updates the stats strip after a successful booking", () => {
    mockPickRooms.mockReturnValueOnce({
      ok: true,
      rooms: [
        { id: 101, floor: 1, position: 1 },
        { id: 102, floor: 1, position: 2 },
        { id: 103, floor: 1, position: 3 },
      ],
      travelTime: 2,
      spansMultipleFloors: false,
    });
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    expect(screen.getByText("94")).toBeInTheDocument(); // available
    expect(screen.getByText("3")).toBeInTheDocument(); // occupied
    expect(screen.getByText("3%")).toBeInTheDocument(); // load
  });
});

describe("<Home /> — random occupancy", () => {
  it("replaces the occupied set with the result and clears the last booking", () => {
    mockRandomOccupancy.mockReturnValueOnce(new Set([105, 209, 1003]));
    render(<Home />);
    fireEvent.click(screen.getByText("mock-random"));
    expect(mockRandomOccupancy).toHaveBeenCalledWith(40);
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-occupied", "105,209,1003");
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "");
    expect(screen.getByTestId("summary")).toHaveTextContent("none");
  });

  it("clears any previous booking highlight when random is clicked", () => {
    mockPickRooms.mockReturnValueOnce({
      ok: true,
      rooms: [{ id: 101, floor: 1, position: 1 }],
      travelTime: 0,
      spansMultipleFloors: false,
    });
    mockRandomOccupancy.mockReturnValueOnce(new Set([301]));
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "101");
    fireEvent.click(screen.getByText("mock-random"));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "");
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-occupied", "301");
  });
});

describe("<Home /> — reset", () => {
  it("clears both occupied and last result", () => {
    mockPickRooms.mockReturnValueOnce({
      ok: true,
      rooms: [
        { id: 101, floor: 1, position: 1 },
        { id: 102, floor: 1, position: 2 },
      ],
      travelTime: 1,
      spansMultipleFloors: false,
    });
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    fireEvent.click(screen.getByText("mock-reset"));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-occupied", "");
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "");
    expect(screen.getByTestId("summary")).toHaveTextContent("none");
  });
});

describe("<Home /> — derived bookedIds memo", () => {
  it("derives an empty booked set when lastResult.ok is false", () => {
    mockPickRooms.mockReturnValueOnce({ ok: false, reason: "x" });
    render(<Home />);
    fireEvent.click(screen.getByText("mock-book"));
    expect(screen.getByTestId("hotel")).toHaveAttribute("data-booked", "");
  });
});
