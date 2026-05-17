import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ControlPanel } from "@/components/ControlPanel";

const setup = (overrides: Partial<React.ComponentProps<typeof ControlPanel>> = {}) => {
  const onBook = jest.fn();
  const onRandom = jest.fn();
  const onReset = jest.fn();
  const utils = render(
    <ControlPanel
      onBook={onBook}
      onRandom={onRandom}
      onReset={onReset}
      {...overrides}
    />,
  );
  return { ...utils, onBook, onRandom, onReset };
};

describe("<ControlPanel />", () => {
  describe("rendering", () => {
    it("renders all control sections", () => {
      setup();
      expect(screen.getByRole("button", { name: /Book rooms/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Generate/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset everything/i })).toBeInTheDocument();
      expect(screen.getByText(/Rooms to book/i)).toBeInTheDocument();
      expect(screen.getByText(/Random occupancy/i)).toBeInTheDocument();
    });

    it("initialises with count=3 and percent=40", () => {
      setup();
      const numberInput = screen.getByDisplayValue("3") as HTMLInputElement;
      expect(numberInput.type).toBe("number");
      const range = screen.getByDisplayValue("40") as HTMLInputElement;
      expect(range.type).toBe("range");
      expect(screen.getByText("40%")).toBeInTheDocument();
    });

    it("renders +/- stepper buttons", () => {
      setup();
      expect(screen.getByRole("button", { name: "decrease" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "increase" })).toBeInTheDocument();
    });

    it("displays the per-booking cap helper text", () => {
      setup();
      expect(screen.getByText(/Max 5 rooms per booking/i)).toBeInTheDocument();
    });
  });

  describe("count stepper", () => {
    it("increments count when + is clicked", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "increase" }));
      expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    });

    it("decrements count when - is clicked", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "decrease" }));
      expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    });

    it("clamps at the lower bound (1)", async () => {
      const user = userEvent.setup();
      setup();
      // start at 3, click - four times → should hit 1, not 0
      for (let i = 0; i < 4; i++) {
        await user.click(screen.getByRole("button", { name: "decrease" }));
      }
      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    });

    it("clamps at the upper bound (MAX_BOOKING = 5)", async () => {
      const user = userEvent.setup();
      setup();
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByRole("button", { name: "increase" }));
      }
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("accepts a valid typed number", () => {
      setup();
      const input = screen.getByDisplayValue("3") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "4" } });
      expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    });

    it("clamps a typed value above the max", () => {
      setup();
      const input = screen.getByDisplayValue("3") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "99" } });
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("clamps a typed value below 1", () => {
      setup();
      const input = screen.getByDisplayValue("3") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "0" } });
      expect(screen.getByDisplayValue("1")).toBeInTheDocument();
    });

    it("ignores non-finite typed values (NaN guard)", () => {
      setup();
      const input = screen.getByDisplayValue("3") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "abc" } });
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    });
  });

  describe("Book button", () => {
    it("calls onBook with the current count", async () => {
      const user = userEvent.setup();
      const { onBook } = setup();
      await user.click(screen.getByRole("button", { name: /Book rooms/i }));
      expect(onBook).toHaveBeenCalledWith(3);
    });

    it("passes the updated count after stepping", async () => {
      const user = userEvent.setup();
      const { onBook } = setup();
      await user.click(screen.getByRole("button", { name: "increase" })); // count → 4
      await user.click(screen.getByRole("button", { name: /Book rooms/i }));
      expect(onBook).toHaveBeenCalledWith(4);
    });

    it("respects the disabled prop", async () => {
      const user = userEvent.setup();
      const { onBook } = setup({ disabled: true });
      const button = screen.getByRole("button", { name: /Book rooms/i });
      expect(button).toBeDisabled();
      await user.click(button);
      expect(onBook).not.toHaveBeenCalled();
    });
  });

  describe("occupancy slider + Generate", () => {
    it("updates the displayed percent when the slider moves", () => {
      setup();
      const range = screen.getByDisplayValue("40") as HTMLInputElement;
      fireEvent.change(range, { target: { value: "75" } });
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("calls onRandom with the current percent", async () => {
      const user = userEvent.setup();
      const { onRandom } = setup();
      await user.click(screen.getByRole("button", { name: /Generate/i }));
      expect(onRandom).toHaveBeenCalledWith(40);
    });

    it("calls onRandom with the slider's latest value after a change", () => {
      const { onRandom } = setup();
      const range = screen.getByDisplayValue("40") as HTMLInputElement;
      fireEvent.change(range, { target: { value: "10" } });
      fireEvent.click(screen.getByRole("button", { name: /Generate/i }));
      expect(onRandom).toHaveBeenCalledWith(10);
    });
  });

  describe("Reset button", () => {
    it("calls onReset when clicked", async () => {
      const user = userEvent.setup();
      const { onReset } = setup();
      await user.click(screen.getByRole("button", { name: /Reset everything/i }));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
});
