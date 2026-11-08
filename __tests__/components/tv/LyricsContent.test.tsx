import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LyricsContent } from "@/components/tv/LyricsContent";

const baseProps = {
  nextLine: "Next line",
  lyricsError: null,
  lyricsLoading: false,
  lyricsFile: null,
  hasLyricsPath: true,
};

describe("LyricsContent", () => {
  it("renders a plain line as text exactly as before", () => {
    render(<LyricsContent {...baseProps} currentLine="Hello world" />);
    const current = screen.getByTestId("current-lyric");
    expect(current.textContent).toBe("Hello world");
    expect(screen.queryByTestId("lyric-word")).toBeNull();
    expect(screen.getByText("Next line")).toBeInTheDocument();
  });

  it("falls back to plain text when the words array is empty", () => {
    render(
      <LyricsContent
        {...baseProps}
        currentLine="Hello world"
        currentLineWords={[]}
      />
    );
    expect(screen.queryByTestId("lyric-word")).toBeNull();
    expect(screen.getByTestId("current-lyric").textContent).toBe("Hello world");
  });

  it("renders word spans for an enhanced line and keeps the same text", () => {
    render(
      <LyricsContent
        {...baseProps}
        currentLine="Hello world"
        currentLineWords={[
          { word: "Hello", startMs: 12000 },
          { word: "world", startMs: 12500 },
        ]}
        currentLineEndMs={13000}
        currentTime={12.6}
        isPlaying={false}
      />
    );
    const spans = screen.getAllByTestId("lyric-word");
    expect(spans).toHaveLength(2);
    expect(spans.map(s => s.getAttribute("data-state"))).toEqual([
      "sung",
      "current",
    ]);
    expect(screen.getByTestId("current-lyric").textContent).toBe("Hello world");
  });

  it("shows the no-lyrics message when there is no lyrics path", () => {
    render(
      <LyricsContent {...baseProps} currentLine="" hasLyricsPath={false} />
    );
    expect(
      screen.getByText("No lyrics available - Enjoy the music!")
    ).toBeInTheDocument();
  });
});
