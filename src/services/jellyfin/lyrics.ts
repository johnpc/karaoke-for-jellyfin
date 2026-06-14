// Lyrics fetching from Jellyfin
import type { JellyfinContext } from "./types";

interface MediaStream {
  Type: string;
  Codec: string;
  Index: number;
  DisplayTitle?: string;
  Language?: string;
}

interface LyricsEntry {
  Start?: number;
  Text?: string;
}

type LyricsResult = string | LyricsEntry[] | null;

/**
 * Get lyrics for a media item from Jellyfin
 */
export async function getLyrics(
  ctx: JellyfinContext,
  itemId: string
): Promise<LyricsResult> {
  try {
    const lyricsUrl = `${ctx.baseUrl}/Audio/${itemId}/Lyrics`;
    const response = await fetch(lyricsUrl, {
      headers: {
        "X-Emby-Token": ctx.apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const lyricsData = await response.json();
      if (Array.isArray(lyricsData)) return lyricsData;
      if (lyricsData.Lyrics) return lyricsData.Lyrics;
      if (typeof lyricsData === "string") return lyricsData;
      if (lyricsData.lyrics) return lyricsData.lyrics;
      return null;
    }

    // Direct endpoint failed — try embedded lyrics via media streams
    return await tryEmbeddedLyrics(ctx, itemId);
  } catch (error) {
    console.error("Failed to get lyrics from Jellyfin:", error);
    return null;
  }
}

/**
 * Try to extract lyrics from embedded subtitle streams
 */
async function tryEmbeddedLyrics(
  ctx: JellyfinContext,
  itemId: string
): Promise<LyricsResult> {
  const itemResponse = await fetch(
    `${ctx.baseUrl}/Items/${itemId}?userId=${ctx.userId}&fields=MediaStreams,MediaSources`,
    {
      headers: {
        "X-Emby-Token": ctx.apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!itemResponse.ok) return null;

  const itemData = await itemResponse.json();
  const mediaStreams: MediaStream[] =
    itemData.MediaSources?.[0]?.MediaStreams || [];

  const lyricsStreams = mediaStreams.filter(
    stream =>
      stream.Type === "Subtitle" &&
      (stream.Codec === "lrc" ||
        stream.DisplayTitle?.toLowerCase().includes("lyrics") ||
        stream.Language?.toLowerCase().includes("lrc"))
  );

  if (lyricsStreams.length === 0) return null;

  const lyricsStream = lyricsStreams[0];
  const subtitleUrl = `${ctx.baseUrl}/Videos/${itemId}/${lyricsStream.Index}/Subtitles/0/Stream.lrc?api_key=${ctx.apiKey}`;

  const subtitleResponse = await fetch(subtitleUrl, {
    headers: { "X-Emby-Token": ctx.apiKey },
  });

  if (subtitleResponse.ok) {
    return await subtitleResponse.text();
  }

  return null;
}

/**
 * Check if an item has lyrics available
 */
export async function hasLyrics(
  ctx: JellyfinContext,
  itemId: string
): Promise<boolean> {
  const lyrics = await getLyrics(ctx, itemId);
  if (Array.isArray(lyrics)) {
    return (
      lyrics.length > 0 && lyrics.some(item => item.Text && item.Text.trim())
    );
  }
  return (
    lyrics !== null && typeof lyrics === "string" && lyrics.trim().length > 0
  );
}
