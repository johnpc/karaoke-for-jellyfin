import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadingSpinner } from "@/components/mobile/search-interface-components/LoadingSpinner";

describe("LoadingSpinner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<LoadingSpinner message="Loading..." />);
    expect(screen.getByTestId("search-loading")).toBeInTheDocument();
  });

  it("displays the provided message", () => {
    render(<LoadingSpinner message="Searching..." />);
    expect(screen.getByText("Searching...")).toBeInTheDocument();
  });

  it("displays different messages", () => {
    render(<LoadingSpinner message="Finding songs by Artist..." />);
    expect(screen.getByText("Finding songs by Artist...")).toBeInTheDocument();
  });
});
