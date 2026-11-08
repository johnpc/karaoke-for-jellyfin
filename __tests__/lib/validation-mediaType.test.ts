import { describe, it, expect } from "vitest";
import { isValidMediaItem, isValidMediaType } from "@/lib/validation/media";

const base = {
  id: "media_1",
  title: "Song",
  artist: "Artist",
  duration: 120,
  jellyfinId: "jf1",
  streamUrl: "http://localhost:3000/api/stream/jf1",
};

describe("media item validation with mediaType", () => {
  it("accepts items without a mediaType (legacy audio)", () => {
    expect(isValidMediaItem(base)).toBe(true);
  });

  it("accepts audio and video media types", () => {
    expect(isValidMediaItem({ ...base, mediaType: "audio" })).toBe(true);
    expect(isValidMediaItem({ ...base, mediaType: "video" })).toBe(true);
  });

  it("rejects unknown media types", () => {
    expect(isValidMediaItem({ ...base, mediaType: "cdg" })).toBe(false);
    expect(isValidMediaItem({ ...base, mediaType: 1 })).toBe(false);
  });

  it("isValidMediaType guards the union", () => {
    expect(isValidMediaType("audio")).toBe(true);
    expect(isValidMediaType("video")).toBe(true);
    expect(isValidMediaType("")).toBe(false);
    expect(isValidMediaType(undefined)).toBe(false);
  });
});
