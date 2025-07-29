// API route for getting songs by artist ID using Jellyfin SDK
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinSDKService } from "@/services/jellyfin-sdk";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artistId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);
    const startIndex = Math.max(
      parseInt(searchParams.get("startIndex") || "0"),
      0
    );

    const { artistId } = await params;

    if (!artistId) {
      return NextResponse.json(
        createErrorResponse("INVALID_ARTIST_ID", "Artist ID is required"),
        { status: 400 }
      );
    }

    // Extract the actual Jellyfin ID from our prefixed ID
    const jellyfinArtistId = artistId.startsWith("jellyfin_artist_")
      ? artistId.replace("jellyfin_artist_", "")
      : artistId;

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

    // Get songs by artist ID using the SDK
    const result = await jellyfinService.getSongsByArtistId(
      jellyfinArtistId,
      limit,
      startIndex
    );

    return NextResponse.json(
      createPaginatedResponse(
        result.songs,
        Math.floor(startIndex / limit) + 1,
        limit,
        result.totalCount // Use the actual total count from Jellyfin
      )
    );
  } catch (error) {
    console.error("Get songs by artist API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "GET_SONGS_BY_ARTIST_FAILED",
        "Failed to get songs by artist"
      ),
      { status: 500 }
    );
  }
}
