import React from "react";
import { render, screen } from "@testing-library/react";
import { Room } from "@/components/Room";
import type { Room as RoomType } from "@/lib/types";

const sampleRoom: RoomType = { id: 305, floor: 3, position: 5 };

describe("<Room />", () => {
  it("renders the room id as text", () => {
    render(<Room room={sampleRoom} state="available" />);
    expect(screen.getByText("305")).toBeInTheDocument();
  });

  it("applies the available styles when state='available'", () => {
    render(<Room room={sampleRoom} state="available" />);
    const el = screen.getByTitle(/Room 305 — available/i);
    expect(el.className).toMatch(/var\(--available-bg\)/);
    expect(el.className).toMatch(/text-\[var\(--available\)\]/);
  });

  it("applies the occupied styles when state='occupied'", () => {
    render(<Room room={sampleRoom} state="occupied" />);
    const el = screen.getByTitle(/Room 305 — occupied/i);
    expect(el.className).toMatch(/var\(--occupied-bg\)/);
    expect(el.className).toMatch(/text-\[var\(--occupied\)\]/);
  });

  it("applies the booked styles (filled fill + halo shadow) when state='booked'", () => {
    render(<Room room={sampleRoom} state="booked" />);
    const el = screen.getByTitle(/Room 305 — booked/i);
    expect(el.className).toMatch(/var\(--booked\)/);
    expect(el.className).toMatch(/var\(--booked-fg\)/);
    expect(el.className).toMatch(/var\(--booked-halo\)/);
  });

  it("sets a descriptive title attribute for hover/a11y", () => {
    render(<Room room={sampleRoom} state="occupied" />);
    expect(screen.getByTitle("Room 305 — occupied")).toBeInTheDocument();
  });

  it("handles a floor-10 room id correctly", () => {
    const top: RoomType = { id: 1007, floor: 10, position: 7 };
    render(<Room room={top} state="available" />);
    expect(screen.getByText("1007")).toBeInTheDocument();
  });
});
