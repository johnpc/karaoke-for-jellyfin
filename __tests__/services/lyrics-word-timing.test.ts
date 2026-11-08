import { describe, it, expect } from "vitest";
import { parseLRC, parseJellyfinLyrics } from "@/services/lyrics";

describe("parseLRC with Enhanced LRC lines", () => {
  const content = `[ti:Mixed Song]
[00:10.00]Plain line stays as is
[00:12.00]<00:12.00>Hello <00:12.50>world
[00:15.00] <00:15.00>Sing <00:15.40>along <00:16.00>now
[00:20.00]Another plain line`;

  it("leaves standard lines unchanged (no words key)", () => {
    const result = parseLRC(content, "song");
    expect(result.lines[0]).toEqual({
      timestamp: 10000,
      text: "Plain line stays as is",
      duration: 2000,
      isChorus: false,
      isVerse: false,
    });
    expect(result.lines[0]).not.toHaveProperty("words");
    expect(result.lines[3]).not.toHaveProperty("words");
  });

  it("strips inline tags from text and attaches words", () => {
    const result = parseLRC(content, "song");
    expect(result.lines[1].text).toBe("Hello world");
    expect(result.lines[1].words).toEqual([
      { word: "Hello", startMs: 12000 },
      { word: "world", startMs: 12500 },
    ]);
    expect(result.lines[1].duration).toBe(3000);
    expect(result.lines[2].text).toBe("Sing along now");
    expect(result.lines[2].words).toEqual([
      { word: "Sing", startMs: 15000 },
      { word: "along", startMs: 15400 },
      { word: "now", startMs: 16000 },
    ]);
  });

  it("still parses metadata and keeps line count", () => {
    const result = parseLRC(content, "song");
    expect(result.metadata?.title).toBe("Mixed Song");
    expect(result.lines).toHaveLength(4);
  });

  it("does not mistake a lyric starting with a tag for an empty line", () => {
    const result = parseLRC("[00:01.00]<00:01.00>Go", "song");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].text).toBe("Go");
    expect(result.lines[0].words).toEqual([{ word: "Go", startMs: 1000 }]);
  });
});

describe("parseJellyfinLyrics with word timing", () => {
  it("keeps plain Jellyfin lines unchanged", () => {
    const result = parseJellyfinLyrics(
      [{ Start: 100000000, Text: " Hello world " }],
      "song"
    );
    expect(result.lines).toEqual([{ timestamp: 10000, text: "Hello world" }]);
  });

  it("ignores empty cue arrays", () => {
    const result = parseJellyfinLyrics(
      [{ Start: 100000000, Text: "Hello world", Cues: [] }],
      "song"
    );
    expect(result.lines[0]).not.toHaveProperty("words");
  });

  it("maps Jellyfin cues onto words", () => {
    const result = parseJellyfinLyrics(
      [
        {
          Start: 120000000,
          Text: "Hello world",
          Cues: [
            { Position: 0, EndPosition: 6, Start: 120000000, End: 125000000 },
            { Position: 6, EndPosition: 11, Start: 125000000, End: null },
          ],
        },
      ],
      "song"
    );
    expect(result.lines[0]).toEqual({
      timestamp: 12000,
      text: "Hello world",
      words: [
        { word: "Hello", startMs: 12000 },
        { word: "world", startMs: 12500 },
      ],
    });
  });

  it("parses inline tags when a server passes raw Enhanced LRC text through", () => {
    const result = parseJellyfinLyrics(
      [{ Start: 120000000, Text: "<00:12.00>Hello <00:12.50>world" }],
      "song"
    );
    expect(result.lines[0]).toEqual({
      timestamp: 12000,
      text: "Hello world",
      words: [
        { word: "Hello", startMs: 12000 },
        { word: "world", startMs: 12500 },
      ],
    });
  });

  it("filters empty lines and sorts by time", () => {
    const result = parseJellyfinLyrics(
      [
        { Start: 200000000, Text: "second" },
        { Start: 50000000, Text: "   " },
        { Start: 100000000, Text: "first" },
      ],
      "song"
    );
    expect(result.lines.map(l => l.text)).toEqual(["first", "second"]);
    expect(result.format).toBe("lrc");
    expect(result.songId).toBe("song");
  });
});
