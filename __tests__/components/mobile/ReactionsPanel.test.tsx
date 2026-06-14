import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReactionsPanel } from "@/components/mobile/ReactionsPanel";

describe("ReactionsPanel", () => {
  const mockOnReaction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the FAB button in closed state", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    const fab = screen.getByLabelText("Open reactions");
    expect(fab).toBeInTheDocument();
  });

  it("does not show emoji buttons when closed", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    expect(screen.queryByTestId("reaction-🔥")).not.toBeInTheDocument();
  });

  it("shows emoji buttons when FAB is clicked", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    fireEvent.click(screen.getByLabelText("Open reactions"));

    expect(screen.getByTestId("reaction-🔥")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-❤️")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-🎤")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-👏")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-😂")).toBeInTheDocument();
    expect(screen.getByTestId("reaction-🙌")).toBeInTheDocument();
  });

  it("calls onReaction with the emoji when an emoji button is tapped", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    fireEvent.click(screen.getByLabelText("Open reactions"));
    fireEvent.click(screen.getByTestId("reaction-🔥"));

    expect(mockOnReaction).toHaveBeenCalledWith("🔥");
  });

  it("shows close button when open", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    fireEvent.click(screen.getByLabelText("Open reactions"));

    expect(screen.getByLabelText("Close reactions")).toBeInTheDocument();
  });

  it("hides emoji buttons when close is clicked", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    fireEvent.click(screen.getByLabelText("Open reactions"));
    expect(screen.getByTestId("reaction-🔥")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close reactions"));
    expect(screen.queryByTestId("reaction-🔥")).not.toBeInTheDocument();
  });

  it("applies scale animation on tap then resets", () => {
    render(<ReactionsPanel onReaction={mockOnReaction} />);

    fireEvent.click(screen.getByLabelText("Open reactions"));
    const btn = screen.getByTestId("reaction-❤️");

    fireEvent.click(btn);
    expect(btn.className).toContain("scale-125");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(btn.className).toContain("scale-100");
  });
});
