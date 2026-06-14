import { NextRequest } from "next/server";
import { getLyricsService } from "@/services/lyrics";
import path from "path";
import { errorResponse, successResponse } from "./helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;
    const { searchParams } = new URL(request.url);
    const currentTime = searchParams.get("time");

    if (!songId) {
      return errorResponse("INVALID_REQUEST", "Song ID is required", 400);
    }

    const lyricsService = getLyricsService();
    const searchPaths = [
      process.env.LYRICS_PATH || "/lyrics",
      process.env.JELLYFIN_MEDIA_PATH || "/media",
      path.join(process.cwd(), "lyrics"),
    ];

    const lyricsFile = await lyricsService.getLyrics(songId, searchPaths);

    if (!lyricsFile) {
      return errorResponse(
        "LYRICS_NOT_FOUND",
        `No lyrics found for song: ${songId}`,
        404
      );
    }

    if (currentTime !== null) {
      const syncState = lyricsService.updateSyncState(
        songId,
        parseFloat(currentTime)
      );
      if (!syncState) {
        return errorResponse(
          "SYNC_FAILED",
          "Unable to sync lyrics at current time",
          404
        );
      }
      return successResponse(syncState);
    }

    return successResponse(lyricsFile);
  } catch (error) {
    console.error("Lyrics API error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to retrieve lyrics",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { songId } = await params;
    const body = await request.json();
    const { currentTime } = body;

    if (!songId || typeof currentTime !== "number") {
      return errorResponse(
        "INVALID_REQUEST",
        "Song ID and current time are required",
        400
      );
    }

    const lyricsService = getLyricsService();
    const syncState = lyricsService.updateSyncState(songId, currentTime);

    if (!syncState) {
      return errorResponse(
        "LYRICS_NOT_FOUND",
        `No lyrics loaded for song: ${songId}`,
        404
      );
    }

    return successResponse(syncState);
  } catch (error) {
    console.error("Lyrics sync API error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to sync lyrics",
      500,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
