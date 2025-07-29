// Debug endpoint to test Jellyfin lyrics API
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId parameter required" },
        { status: 400 }
      );
    }

    const jellyfinService = getJellyfinService();

    // Test authentication
    const authenticated = await jellyfinService.authenticate();
    if (!authenticated) {
      return NextResponse.json(
        { error: "Failed to authenticate with Jellyfin" },
        { status: 401 }
      );
    }

    // Test lyrics retrieval
    const lyrics = await jellyfinService.getLyrics(itemId);
    const hasLyrics = await jellyfinService.hasLyrics(itemId);

    // Also get item metadata for context
    const metadata = await jellyfinService.getMediaMetadata(itemId);

    return NextResponse.json({
      itemId,
      hasLyrics,
      lyricsLength: lyrics ? lyrics.length : 0,
      lyricsPreview:
        lyrics && typeof lyrics === "string"
          ? lyrics.substring(0, 200) + "..."
          : null,
      metadata: metadata
        ? {
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
          }
        : null,
      // Include full lyrics for debugging (remove in production)
      fullLyrics: process.env.NODE_ENV === "development" ? lyrics : null,
    });
  } catch (error) {
    console.error("Jellyfin lyrics test error:", error);
    return NextResponse.json(
      {
        error: "Jellyfin lyrics test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
