import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BackButton } from "@/components/mobile/search-interface-components/BackButton";

describe("BackButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<BackButton onBack={vi.fn()} />);
    expect(screen.getByTestId("back-button")).toBeInTheDocument();
  });

  it("displays default label 'Back to Search'", () => {
    render(<BackButton onBack={vi.fn()} />);
    expect(screen.getByText("Back to Search")).toBeInTheDocument();
  });

  it("displays custom label when provided", () => {
    render(<BackButton onBack={vi.fn()} label="Back to Artists" />);
    expect(screen.getByText("Back to Artists")).toBeInTheDocument();
  });

  it("calls onBack when clicked", () => {
    const onBack = vi.fn();
    render(<BackButton onBack={onBack} />);

    fireEvent.click(screen.getByTestId("back-button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
