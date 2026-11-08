import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  LyricsWords,
  getWordEndMs,
  getWordState,
  getWordProgress,
  DEFAULT_WORD_MS,
} from "@/components/tv/LyricsWords";
import { LyricsWord } from "@/types";

const words: LyricsWord[] = [
  { word: "Hello", startMs: 12000 },
  { word: "beautiful", startMs: 12500 },
  { word: "world", startMs: 13000 },
];

describe("getWordEndMs", () => {
  it("uses the next word start", () => {
    expect(getWordEndMs(words, 0)).toBe(12500);
  });

  it("uses the line end for the last word when later than its start", () => {
    expect(getWordEndMs(words, 2, 14000)).toBe(14000);
  });

  it("falls back to a default duration when the line end is unknown or invalid", () => {
    expect(getWordEndMs(words, 2)).toBe(13000 + DEFAULT_WORD_MS);
    expect(getWordEndMs(words, 2, 12900)).toBe(13000 + DEFAULT_WORD_MS);
  });
});

describe("getWordState / getWordProgress", () => {
  it("classifies by time", () => {
    expect(getWordState(100, 200, 50)).toBe("upcoming");
    expect(getWordState(100, 200, 100)).toBe("current");
    expect(getWordState(100, 200, 199)).toBe("current");
    expect(getWordState(100, 200, 200)).toBe("sung");
  });

  it("computes a clamped fill fraction", () => {
    expect(getWordProgress(100, 200, 50)).toBe(0);
    expect(getWordProgress(100, 200, 150)).toBe(0.5);
    expect(getWordProgress(100, 200, 500)).toBe(1);
  });

  it("handles zero-length words", () => {
    expect(getWordProgress(100, 100, 99)).toBe(0);
    expect(getWordProgress(100, 100, 100)).toBe(1);
  });
});

describe("LyricsWords", () => {
  const renderAt = (seconds: number) =>
    render(
      <LyricsWords
        words={words}
        lineEndMs={14000}
        currentTime={seconds}
        isPlaying={false}
      />
    );

  it("renders every word with spaces so the text reads naturally", () => {
    renderAt(0);
    expect(screen.getByTestId("lyric-words").textContent).toBe(
      "Hello beautiful world"
    );
    expect(screen.getAllByTestId("lyric-word")).toHaveLength(3);
  });

  it("marks all words upcoming before the line starts", () => {
    renderAt(11);
    const states = screen
      .getAllByTestId("lyric-word")
      .map(el => el.getAttribute("data-state"));
    expect(states).toEqual(["upcoming", "upcoming", "upcoming"]);
  });

  it("highlights sung words and fills the current one", () => {
    renderAt(12.75); // halfway through "beautiful" (12.5 -> 13.0)
    const spans = screen.getAllByTestId("lyric-word");
    expect(spans.map(el => el.getAttribute("data-state"))).toEqual([
      "sung",
      "current",
      "upcoming",
    ]);
    expect(spans[1].style.backgroundImage).toContain("50%");
    expect(spans[0].style.backgroundImage).toBe("");
  });

  it("marks everything sung after the line ends", () => {
    renderAt(14.5);
    const states = screen
      .getAllByTestId("lyric-word")
      .map(el => el.getAttribute("data-state"));
    expect(states).toEqual(["sung", "sung", "sung"]);
  });
});
