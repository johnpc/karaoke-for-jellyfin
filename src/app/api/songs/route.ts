// API route for song search and retrieval
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from "@/lib/utils";
import { validateSearchRequest, ValidationError } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000); // Cap at 1000
    const startIndex = Math.max(
      parseInt(searchParams.get("startIndex") || "0"),
      0
    );

    // Validate search parameters
    if (query) {
      try {
        validateSearchRequest({ query, limit, offset: startIndex });
      } catch (error) {
        if (error instanceof ValidationError) {
          return NextResponse.json(
            createErrorResponse("INVALID_SEARCH", error.message),
            { status: 400 }
          );
        }
        throw error;
      }
    }

    const jellyfinService = getJellyfinService();

    // Health check first
    const isHealthy = await jellyfinService.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        createErrorResponse(
          "JELLYFIN_UNAVAILABLE",
          "Jellyfin server is not accessible"
        ),
        { status: 503 }
      );
    }

    let songs;
    if (query && query.trim()) {
      // Search for specific songs
      songs = await jellyfinService.searchMedia(query.trim(), limit);
    } else {
      // Get all songs for browsing
      songs = await jellyfinService.getAllAudioItems(startIndex, limit);
    }

    // Return paginated response
    return NextResponse.json(
      createPaginatedResponse(
        songs,
        Math.floor(startIndex / limit) + 1,
        limit,
        songs.length // Note: This is approximate, Jellyfin doesn't always return total count
      )
    );
  } catch (error) {
    console.error("Songs API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "SONGS_FETCH_FAILED",
        "Failed to fetch songs from Jellyfin"
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId || typeof itemId !== "string" || itemId.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse("INVALID_REQUEST", "Valid itemId is required"),
        { status: 400 }
      );
    }

    const jellyfinService = getJellyfinService();

    // Health check first
    const isHealthy = await jellyfinService.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        createErrorResponse(
          "JELLYFIN_UNAVAILABLE",
          "Jellyfin server is not accessible"
        ),
        { status: 503 }
      );
    }

    const song = await jellyfinService.getMediaMetadata(itemId.trim());

    if (!song) {
      return NextResponse.json(
        createErrorResponse("SONG_NOT_FOUND", "Song not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse({ song }));
  } catch (error) {
    console.error("Song metadata API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "SONG_METADATA_FAILED",
        "Failed to fetch song metadata"
      ),
      { status: 500 }
    );
  }
}
