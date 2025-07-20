// API route for lyrics retrieval and synchronization
import { NextRequest, NextResponse } from "next/server";
import { getLyricsService } from "@/services/lyrics";
import { ApiResponse, LyricsFile, LyricsSyncState } from "@/types";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> },
) {
  try {
    const { songId } = await params;
    const { searchParams } = new URL(request.url);
    const currentTime = searchParams.get("time");

    if (!songId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Song ID is required",
            timestamp: new Date(),
          },
          timestamp: new Date(),
        },
        { status: 400 },
      );
    }

    const lyricsService = getLyricsService();

    // Define search paths for lyrics files
    const searchPaths = [
      process.env.LYRICS_PATH || "/lyrics",
      process.env.JELLYFIN_MEDIA_PATH || "/media",
      path.join(process.cwd(), "lyrics"),
    ];

    // Get lyrics file
    const lyricsFile = await lyricsService.getLyrics(songId, searchPaths);

    if (!lyricsFile) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "LYRICS_NOT_FOUND",
            message: `No lyrics found for song: ${songId}`,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        },
        { status: 404 },
      );
    }

    // If time parameter is provided, return sync state
    if (currentTime !== null) {
      const timeInSeconds = parseFloat(currentTime);
      const syncState = lyricsService.updateSyncState(songId, timeInSeconds);

      return NextResponse.json<ApiResponse<LyricsSyncState>>({
        success: true,
        data: syncState,
        timestamp: new Date(),
      });
    }

    // Return full lyrics file
    return NextResponse.json<ApiResponse<LyricsFile>>({
      success: true,
      data: lyricsFile,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Lyrics API error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve lyrics",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> },
) {
  try {
    const { songId } = await params;
    const body = await request.json();
    const { currentTime } = body;

    if (!songId || typeof currentTime !== "number") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Song ID and current time are required",
            timestamp: new Date(),
          },
          timestamp: new Date(),
        },
        { status: 400 },
      );
    }

    const lyricsService = getLyricsService();
    const syncState = lyricsService.updateSyncState(songId, currentTime);

    if (!syncState) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "LYRICS_NOT_FOUND",
            message: `No lyrics loaded for song: ${songId}`,
            timestamp: new Date(),
          },
          timestamp: new Date(),
        },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<LyricsSyncState>>({
      success: true,
      data: syncState,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Lyrics sync API error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to sync lyrics",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date(),
        },
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}
