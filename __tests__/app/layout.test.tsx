import React from "react";
import { render } from "@testing-library/react";

// next/font is mocked automatically by next/jest, but be explicit so the test is
// self-documenting and so the variable names are stable for any class assertions.
jest.mock("next/font/google", () => ({
  Inter_Tight: () => ({ variable: "--mock-sans" }),
  JetBrains_Mono: () => ({ variable: "--mock-mono" }),
}));

// importing the CSS in layout would fail in jest unless next/jest stubs it,
// which it does — but we also block it directly to be safe.
jest.mock("../../app/globals.css", () => ({}), { virtual: true });

import RootLayout, { metadata } from "@/app/layout";

describe("RootLayout — metadata", () => {
  it("exports a title", () => {
    expect(metadata.title).toBe("Hotel Reservation");
  });

  it("exports a description", () => {
    expect(metadata.description).toMatch(/Optimal room booking/i);
  });
});

describe("RootLayout — render", () => {
  it("renders children inside the body", () => {
    // Render the layout's body subtree into a container so we don't conflict
    // with the existing <html>/<body> jsdom provides.
    const layoutTree = RootLayout({
      children: <span data-testid="child">hello</span>,
    });
    const { container } = render(<>{layoutTree.props.children.props.children}</>);
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe("hello");
  });

  it("wraps in <html lang='en'> with font class names", () => {
    const tree = RootLayout({ children: <div /> });
    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
    expect(tree.props.className).toContain("--mock-sans");
    expect(tree.props.className).toContain("--mock-mono");
  });
});
