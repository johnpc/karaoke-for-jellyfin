import { describe, it, expect } from "vitest";
import {
  parseEnhancedLrcLine,
  parseWordTiming,
  hasWordTimeTags,
  wordsFromJellyfinCues,
  wordTagToMs,
} from "@/services/lyrics";

describe("wordTagToMs", () => {
  it("converts mm:ss.xx to milliseconds", () => {
    expect(wordTagToMs("00", "12", "50")).toBe(12500);
    expect(wordTagToMs("01", "02", "03")).toBe(62030);
  });

  it("normalises fraction precision", () => {
    expect(wordTagToMs("00", "12", "5")).toBe(12500);
    expect(wordTagToMs("00", "12", "500")).toBe(12500);
    expect(wordTagToMs("00", "12", "345")).toBe(12345);
  });

  it("treats a missing fraction as zero", () => {
    expect(wordTagToMs("00", "12")).toBe(12000);
  });
});

describe("hasWordTimeTags", () => {
  it("detects inline tags", () => {
    expect(hasWordTimeTags("<00:12.00>Hello <00:12.50>world")).toBe(true);
    expect(hasWordTimeTags("Hello <00:12.50>world")).toBe(true);
    expect(hasWordTimeTags("Hello <00:12>world")).toBe(true);
  });

  it("ignores plain lines and malformed tags", () => {
    expect(hasWordTimeTags("Hello world")).toBe(false);
    expect(hasWordTimeTags("<abc>Hello world")).toBe(false);
    expect(hasWordTimeTags("<12.00>Hello")).toBe(false);
    expect(hasWordTimeTags("a < b and b > c")).toBe(false);
  });
});

describe("parseEnhancedLrcLine", () => {
  it("returns a single segment for a standard LRC line", () => {
    expect(parseEnhancedLrcLine("Hello world", 12000)).toEqual([
      { word: "Hello world", startMs: 12000 },
    ]);
  });

  it("trims the single segment", () => {
    expect(parseEnhancedLrcLine("  Hello world  ", 12000)).toEqual([
      { word: "Hello world", startMs: 12000 },
    ]);
  });

  it("returns no segments for an empty line", () => {
    expect(parseEnhancedLrcLine("", 12000)).toEqual([]);
    expect(parseEnhancedLrcLine("   ", 12000)).toEqual([]);
  });

  it("splits an enhanced line into timed words", () => {
    expect(
      parseEnhancedLrcLine("<00:12.00>Hello <00:12.50>world", 12000)
    ).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "world", startMs: 12500 },
    ]);
  });

  it("gives leading text without a tag the line start time", () => {
    expect(parseEnhancedLrcLine("Hello <00:12.50>world", 12000)).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "world", startMs: 12500 },
    ]);
  });

  it("keeps trailing text after the last tag as one segment", () => {
    expect(
      parseEnhancedLrcLine("<00:12.00>Hello <00:12.50>beautiful world", 12000)
    ).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "beautiful world", startMs: 12500 },
    ]);
  });

  it("drops empty segments from a trailing end tag", () => {
    expect(
      parseEnhancedLrcLine("<00:12.00>Hello <00:12.50>world <00:13.00>", 12000)
    ).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "world", startMs: 12500 },
    ]);
  });

  it("accepts mm:ss, mm:ss.x, mm:ss.xxx and colon fractions", () => {
    expect(
      parseEnhancedLrcLine("<00:12>a <00:12.5>b <00:12.750>c <00:13:25>d", 0)
    ).toEqual([
      { word: "a", startMs: 12000 },
      { word: "b", startMs: 12500 },
      { word: "c", startMs: 12750 },
      { word: "d", startMs: 13250 },
    ]);
  });

  it("keeps malformed angle-bracket tags as literal text", () => {
    expect(
      parseEnhancedLrcLine("<00:12.00>Hello <abc>there <00:13.00>world", 12000)
    ).toEqual([
      { word: "Hello <abc>there", startMs: 12000 },
      { word: "world", startMs: 13000 },
    ]);
    expect(parseEnhancedLrcLine("<12.00>Hello <00:12.5x>world", 5000)).toEqual([
      { word: "<12.00>Hello <00:12.5x>world", startMs: 5000 },
    ]);
  });

  it("handles minute values above 99", () => {
    expect(parseEnhancedLrcLine("<100:00.00>late", 0)).toEqual([
      { word: "late", startMs: 6000000 },
    ]);
  });
});

describe("parseWordTiming", () => {
  it("returns trimmed text and no words for a plain line", () => {
    expect(parseWordTiming("  Hello world ", 1000)).toEqual({
      text: "Hello world",
    });
  });

  it("strips tags from the display text and returns words", () => {
    expect(parseWordTiming("<00:12.00>Hello   <00:12.50>world", 12000)).toEqual(
      {
        text: "Hello world",
        words: [
          { word: "Hello", startMs: 12000 },
          { word: "world", startMs: 12500 },
        ],
      }
    );
  });
});

describe("wordsFromJellyfinCues", () => {
  const text = "Hello world again";

  it("returns an empty array without cues", () => {
    expect(wordsFromJellyfinCues(text, undefined)).toEqual([]);
    expect(wordsFromJellyfinCues(text, null)).toEqual([]);
    expect(wordsFromJellyfinCues(text, [])).toEqual([]);
  });

  it("maps character ranges and ticks onto words", () => {
    const cues = [
      { Position: 0, EndPosition: 6, Start: 120000000, End: 125000000 },
      { Position: 6, EndPosition: 12, Start: 125000000, End: 130000000 },
      { Position: 12, EndPosition: 17, Start: 130000000, End: null },
    ];
    expect(wordsFromJellyfinCues(text, cues)).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "world", startMs: 12500 },
      { word: "again", startMs: 13000 },
    ]);
  });

  it("sorts cues by position and drops whitespace-only slices", () => {
    const cues = [
      { Position: 6, EndPosition: 11, Start: 125000000 },
      { Position: 5, EndPosition: 6, Start: 124000000 },
      { Position: 0, EndPosition: 5, Start: 120000000 },
    ];
    expect(wordsFromJellyfinCues(text, cues)).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "world", startMs: 12500 },
    ]);
  });
});
