// API route for artist search
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);
    const startIndex = Math.max(
      parseInt(searchParams.get("startIndex") || "0"),
      0
    );

    if (!query || !query.trim()) {
      return NextResponse.json(
        createErrorResponse("INVALID_SEARCH", "Search query is required"),
        { status: 400 }
      );
    }

    // Validate search parameters
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

    // Search by artist only
    const songs = await jellyfinService.searchByArtist(
      query.trim(),
      limit,
      startIndex
    );

    return NextResponse.json(
      createPaginatedResponse(
        songs,
        Math.floor(startIndex / limit) + 1,
        limit,
        songs.length
      )
    );
  } catch (error) {
    console.error("Artist search API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "ARTIST_SEARCH_FAILED",
        "Failed to search songs by artist"
      ),
      { status: 500 }
    );
  }
}
