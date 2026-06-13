import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock CSS imports (globals.css triggers PostCSS which fails in test env)
vi.mock("@/app/globals.css", () => ({}));

// Mock next/font/google to avoid font loading in tests
vi.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "--font-geist-sans",
  }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono",
  }),
}));

// Mock the ConfigProvider
vi.mock("@/contexts/ConfigContext", () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="config-provider">{children}</div>
  ),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children within the layout", () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Hello World</div>
      </RootLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("wraps children in ConfigProvider", () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test</div>
      </RootLayout>
    );

    const provider = screen.getByTestId("config-provider");
    expect(provider).toBeInTheDocument();
    expect(provider).toContainElement(screen.getByTestId("child-content"));
  });

  it("renders multiple children correctly", () => {
    render(
      <RootLayout>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </RootLayout>
    );

    expect(screen.getByTestId("first")).toBeInTheDocument();
    expect(screen.getByTestId("second")).toBeInTheDocument();
  });

  it("ConfigProvider is an ancestor of all children", () => {
    render(
      <RootLayout>
        <span data-testid="nested-child">Nested Content</span>
      </RootLayout>
    );

    const provider = screen.getByTestId("config-provider");
    const child = screen.getByTestId("nested-child");
    expect(provider).toContainElement(child);
  });

  it("renders without crashing when children are text nodes", () => {
    render(<RootLayout>Simple text content</RootLayout>);

    expect(screen.getByText("Simple text content")).toBeInTheDocument();
  });

  it("renders without crashing when children are empty", () => {
    const { container } = render(<RootLayout>{null}</RootLayout>);

    // Should still render the provider wrapper
    expect(screen.getByTestId("config-provider")).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});
