import { describe, it, expect } from "vitest";
import {
  classifyJellyfinItem,
  isVideoMediaItem,
  buildVideoStreamUrl,
  buildVideoProxyUrl,
  splitArtistTitle,
  VIDEO_ITEM_TYPES,
  DEFAULT_VIDEO_ITEM_TYPES,
} from "@/lib/mediaType";

describe("classifyJellyfinItem", () => {
  it("classifies Audio items as audio", () => {
    expect(classifyJellyfinItem({ Type: "Audio", MediaType: "Audio" })).toBe(
      "audio"
    );
  });

  it.each(["MusicVideo", "Video", "Movie"])(
    "classifies %s items as video",
    type => {
      expect(classifyJellyfinItem({ Type: type })).toBe("video");
    }
  );

  it("falls back to MediaType=Video for other video-bearing types", () => {
    expect(classifyJellyfinItem({ Type: "Episode", MediaType: "Video" })).toBe(
      "video"
    );
  });

  it("returns null for containers and metadata items", () => {
    expect(classifyJellyfinItem({ Type: "MusicArtist" })).toBeNull();
    expect(classifyJellyfinItem({ Type: "MusicAlbum" })).toBeNull();
    expect(classifyJellyfinItem({ Type: "Playlist" })).toBeNull();
    expect(classifyJellyfinItem({})).toBeNull();
    expect(classifyJellyfinItem({ Type: null, MediaType: null })).toBeNull();
  });

  it("exposes the conservative default type list", () => {
    expect(DEFAULT_VIDEO_ITEM_TYPES).toEqual(["MusicVideo"]);
    expect(VIDEO_ITEM_TYPES).toEqual(["MusicVideo", "Video", "Movie"]);
  });
});

describe("isVideoMediaItem", () => {
  it("is true only for mediaType video", () => {
    expect(isVideoMediaItem({ mediaType: "video" })).toBe(true);
    expect(isVideoMediaItem({ mediaType: "audio" })).toBe(false);
  });

  it("treats a missing mediaType as audio (legacy queue entries)", () => {
    expect(isVideoMediaItem({})).toBe(false);
    expect(isVideoMediaItem(null)).toBe(false);
    expect(isVideoMediaItem(undefined)).toBe(false);
  });
});

describe("buildVideoStreamUrl", () => {
  it("builds the Jellyfin static video stream URL without a token in it", () => {
    expect(buildVideoStreamUrl("http://jf:8096", "abc123")).toBe(
      "http://jf:8096/Videos/abc123/stream?static=true"
    );
  });

  it("strips a trailing slash and encodes unsafe characters", () => {
    expect(buildVideoStreamUrl("http://jf:8096/", "a b")).toBe(
      "http://jf:8096/Videos/a%20b/stream?static=true"
    );
  });
});

describe("buildVideoProxyUrl", () => {
  it("points at the app stream proxy with the video flag", () => {
    expect(buildVideoProxyUrl("abc123")).toBe("/api/stream/abc123?type=video");
  });
});

describe("splitArtistTitle", () => {
  it("splits 'Artist - Title' file names", () => {
    expect(splitArtistTitle("Queen - Bohemian Rhapsody")).toEqual({
      artist: "Queen",
      title: "Bohemian Rhapsody",
    });
  });

  it("splits on the first separator only", () => {
    expect(splitArtistTitle("A-ha - Take On Me - Karaoke")).toEqual({
      artist: "A-ha",
      title: "Take On Me - Karaoke",
    });
  });

  it("returns the whole name as title when there is no separator", () => {
    expect(splitArtistTitle("  Bohemian Rhapsody ")).toEqual({
      artist: null,
      title: "Bohemian Rhapsody",
    });
    expect(splitArtistTitle("Rock-n-Roll")).toEqual({
      artist: null,
      title: "Rock-n-Roll",
    });
  });
});
