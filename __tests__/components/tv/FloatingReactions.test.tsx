import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FloatingReactions } from "@/components/tv/FloatingReactions";
import { Reaction } from "@/hooks/useReactions";

const makeReaction = (
  id: string,
  emoji: string,
  userName: string
): Reaction => ({
  id,
  emoji,
  userName,
  timestamp: Date.now(),
});

describe("FloatingReactions", () => {
  it("renders nothing when reactions array is empty", () => {
    const { container } = render(<FloatingReactions reactions={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders floating reactions with emojis and usernames", () => {
    const reactions = [
      makeReaction("r1", "🔥", "Alice"),
      makeReaction("r2", "❤️", "Bob"),
    ];

    render(<FloatingReactions reactions={reactions} />);

    const elements = screen.getAllByTestId("floating-reaction");
    expect(elements).toHaveLength(2);
    expect(elements[0]).toHaveTextContent("🔥");
    expect(elements[0]).toHaveTextContent("Alice");
    expect(elements[1]).toHaveTextContent("❤️");
    expect(elements[1]).toHaveTextContent("Bob");
  });

  it("positions reactions based on their ID hash", () => {
    const reactions = [makeReaction("abc", "🎤", "Charlie")];

    render(<FloatingReactions reactions={reactions} />);

    const el = screen.getByTestId("floating-reaction");
    const style = el.getAttribute("style");
    expect(style).toContain("left:");
    expect(style).toMatch(/left: \d+%/);
  });

  it("renders the container with pointer-events-none", () => {
    const reactions = [makeReaction("r1", "👏", "Dave")];

    render(<FloatingReactions reactions={reactions} />);

    const container = screen.getByTestId("floating-reactions-container");
    expect(container.className).toContain("pointer-events-none");
  });
});
