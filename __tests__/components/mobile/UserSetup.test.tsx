import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserSetup } from "@/components/mobile/UserSetup";

describe("UserSetup", () => {
  const mockOnSetup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    expect(screen.getByTestId("user-setup")).toBeInTheDocument();
  });

  it("displays default title and subtitle", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    expect(screen.getByText("Welcome to Karaoke!")).toBeInTheDocument();
    expect(
      screen.getByText("Enter your name to join the karaoke session")
    ).toBeInTheDocument();
  });

  it("displays custom title and subtitle when provided", () => {
    render(
      <UserSetup
        onSetup={mockOnSetup}
        title="Custom Title"
        subtitle="Custom subtitle text"
      />
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom subtitle text")).toBeInTheDocument();
  });

  it("renders the username input field", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const input = screen.getByTestId("username-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Enter your name");
    expect(input).toHaveAttribute("maxLength", "50");
    expect(input).toBeRequired();
  });

  it("renders the join button", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const button = screen.getByTestId("join-session-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Join Karaoke Session");
  });

  it("disables the button when input is empty", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const button = screen.getByTestId("join-session-button");
    expect(button).toBeDisabled();
  });

  it("enables the button when name is entered", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const input = screen.getByTestId("username-input");
    fireEvent.change(input, { target: { value: "John" } });

    const button = screen.getByTestId("join-session-button");
    expect(button).not.toBeDisabled();
  });

  it("calls onSetup with trimmed name on form submit", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const input = screen.getByTestId("username-input");
    fireEvent.change(input, { target: { value: "  John  " } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(mockOnSetup).toHaveBeenCalledWith("John");
  });

  it("does not call onSetup when name is only whitespace", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const input = screen.getByTestId("username-input");
    fireEvent.change(input, { target: { value: "   " } });

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(mockOnSetup).not.toHaveBeenCalled();
  });

  it("updates input value as user types", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const input = screen.getByTestId("username-input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Alice" } });

    expect(input.value).toBe("Alice");
  });

  it("shows the Your Name label", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    expect(screen.getByText("Your Name")).toBeInTheDocument();
  });

  it("shows privacy notice", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    expect(
      screen.getByText("Your name will be visible to other participants")
    ).toBeInTheDocument();
  });

  it("keeps button disabled for whitespace-only input", () => {
    render(<UserSetup onSetup={mockOnSetup} />);

    const input = screen.getByTestId("username-input");
    fireEvent.change(input, { target: { value: "   " } });

    const button = screen.getByTestId("join-session-button");
    expect(button).toBeDisabled();
  });
});
