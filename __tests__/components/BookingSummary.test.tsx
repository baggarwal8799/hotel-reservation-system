import React from "react";
import { render, screen } from "@testing-library/react";
import { BookingSummary } from "@/components/BookingSummary";
import type { BookingResult, Room } from "@/lib/types";

const room = (id: number, floor: number, position: number): Room => ({ id, floor, position });

describe("<BookingSummary />", () => {
  it("renders the empty placeholder when result is null", () => {
    render(<BookingSummary result={null} />);
    expect(screen.getByText(/Last booking/i)).toBeInTheDocument();
    expect(screen.getByText(/No booking yet/i)).toBeInTheDocument();
  });

  it("renders the failure card when result.ok is false", () => {
    const fail: BookingResult = { ok: false, reason: "Only 0 room(s) available." };
    render(<BookingSummary result={fail} />);
    expect(screen.getByText(/Booking failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Only 0 room\(s\) available/i)).toBeInTheDocument();
  });

  it("renders confirmation with single-floor label when booking is on one floor", () => {
    const ok: BookingResult = {
      ok: true,
      rooms: [room(101, 1, 1), room(102, 1, 2), room(103, 1, 3)],
      travelTime: 2,
      spansMultipleFloors: false,
    };
    render(<BookingSummary result={ok} />);
    expect(screen.getByText(/Booking confirmed/i)).toBeInTheDocument();
    expect(screen.getByText("Single floor")).toBeInTheDocument();
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("102")).toBeInTheDocument();
    expect(screen.getByText("103")).toBeInTheDocument();
    expect(screen.getByText("2 min")).toBeInTheDocument();
  });

  it("renders the multi-floor label when booking spans floors", () => {
    const ok: BookingResult = {
      ok: true,
      rooms: [room(101, 1, 1), room(102, 1, 2), room(201, 2, 1), room(202, 2, 2)],
      travelTime: 3,
      spansMultipleFloors: true,
    };
    render(<BookingSummary result={ok} />);
    expect(screen.getByText("Multi-floor")).toBeInTheDocument();
    expect(screen.getByText("3 min")).toBeInTheDocument();
  });

  it("renders all room chips in the order they are passed", () => {
    const ok: BookingResult = {
      ok: true,
      rooms: [room(901, 9, 1), room(902, 9, 2)],
      travelTime: 1,
      spansMultipleFloors: false,
    };
    const { container } = render(<BookingSummary result={ok} />);
    const chips = Array.from(container.querySelectorAll("span")).filter(
      (s) => s.textContent === "901" || s.textContent === "902",
    );
    expect(chips.map((c) => c.textContent)).toEqual(["901", "902"]);
  });
});
