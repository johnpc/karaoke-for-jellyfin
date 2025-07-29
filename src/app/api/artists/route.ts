// API route for artist search using Jellyfin SDK
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinSDKService } from "@/services/jellyfin-sdk";
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

    const jellyfinService = getJellyfinSDKService();

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

    let artists;

    if (query && query.trim()) {
      // Validate search parameters when query is provided
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

      // Search for artists using the SDK
      artists = await jellyfinService.searchArtists(
        query.trim(),
        limit,
        startIndex
      );
    } else {
      // Get all artists when no query is provided
      artists = await jellyfinService.getAllArtists(limit, startIndex);
    }

    return NextResponse.json(
      createPaginatedResponse(
        artists,
        Math.floor(startIndex / limit) + 1,
        limit,
        artists.length
      )
    );
  } catch (error) {
    console.error("Artist API error:", error);
    return NextResponse.json(
      createErrorResponse("ARTIST_REQUEST_FAILED", "Failed to get artists"),
      { status: 500 }
    );
  }
}
