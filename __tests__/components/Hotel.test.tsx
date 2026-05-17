import React from "react";
import { render, screen } from "@testing-library/react";

// Mock the Room component so we can see what state Hotel passes down per room.
jest.mock("@/components/Room", () => ({
  __esModule: true,
  Room: ({ room, state }: { room: { id: number }; state: string }) => (
    <div data-testid={`room-${room.id}`} data-state={state}>
      {room.id}
    </div>
  ),
}));

import { Hotel } from "@/components/Hotel";

describe("<Hotel />", () => {
  it("renders all 97 rooms across 10 floors", () => {
    const { container } = render(<Hotel occupied={new Set()} booked={new Set()} />);
    const rooms = container.querySelectorAll('[data-testid^="room-"]');
    expect(rooms).toHaveLength(97);
  });

  it("renders every floor label 01..10", () => {
    render(<Hotel occupied={new Set()} booked={new Set()} />);
    for (const label of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("passes state='available' to rooms not in either set", () => {
    render(<Hotel occupied={new Set()} booked={new Set()} />);
    expect(screen.getByTestId("room-101")).toHaveAttribute("data-state", "available");
    expect(screen.getByTestId("room-1007")).toHaveAttribute("data-state", "available");
  });

  it("passes state='occupied' to rooms in the occupied set", () => {
    render(<Hotel occupied={new Set([102, 203])} booked={new Set()} />);
    expect(screen.getByTestId("room-102")).toHaveAttribute("data-state", "occupied");
    expect(screen.getByTestId("room-203")).toHaveAttribute("data-state", "occupied");
    expect(screen.getByTestId("room-101")).toHaveAttribute("data-state", "available");
  });

  it("passes state='booked' to rooms in the booked set (booked wins over occupied)", () => {
    render(<Hotel occupied={new Set([101, 102])} booked={new Set([101])} />);
    expect(screen.getByTestId("room-101")).toHaveAttribute("data-state", "booked");
    expect(screen.getByTestId("room-102")).toHaveAttribute("data-state", "occupied");
  });

  it("renders only 7 rooms on floor 10", () => {
    const { container } = render(<Hotel occupied={new Set()} booked={new Set()} />);
    const floor10Rooms = Array.from(container.querySelectorAll('[data-testid^="room-1"]')).filter(
      (el) => {
        const id = Number(el.getAttribute("data-testid")!.replace("room-", ""));
        return id >= 1001 && id <= 1007;
      },
    );
    expect(floor10Rooms).toHaveLength(7);
  });

  it("displays the 'Building' header and 'stairs · lift on left' note", () => {
    render(<Hotel occupied={new Set()} booked={new Set()} />);
    expect(screen.getByText(/Building/i)).toBeInTheDocument();
    expect(screen.getByText(/stairs · lift on left/i)).toBeInTheDocument();
  });

  it("renders the Lobby / Ground footer rule", () => {
    render(<Hotel occupied={new Set()} booked={new Set()} />);
    expect(screen.getByText(/Lobby/i)).toBeInTheDocument();
    expect(screen.getByText(/Ground/i)).toBeInTheDocument();
  });

  it("renders 10 elevator-shaft stop markers", () => {
    const { container } = render(<Hotel occupied={new Set()} booked={new Set()} />);
    // each floor has a marker ring (span with rounded-full class)
    const markers = container.querySelectorAll("span.rounded-full");
    expect(markers).toHaveLength(10);
  });
});
