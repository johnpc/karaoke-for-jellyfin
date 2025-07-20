// API route for getting playlist items using Jellyfin SDK
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinSDKService } from "@/services/jellyfin-sdk";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);
    const startIndex = Math.max(
      parseInt(searchParams.get("startIndex") || "0"),
      0,
    );

    const { playlistId } = await params;

    if (!playlistId) {
      return NextResponse.json(
        createErrorResponse("INVALID_PLAYLIST_ID", "Playlist ID is required"),
        { status: 400 },
      );
    }

    // Extract the actual Jellyfin ID from our prefixed ID
    const jellyfinPlaylistId = playlistId.startsWith("jellyfin_playlist_") 
      ? playlistId.replace("jellyfin_playlist_", "")
      : playlistId;

    const jellyfinService = getJellyfinSDKService();

    // Health check first
    const isHealthy = await jellyfinService.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        createErrorResponse(
          "JELLYFIN_UNAVAILABLE",
          "Jellyfin server is not accessible",
        ),
        { status: 503 },
      );
    }

    // Get playlist items using the SDK
    const items = await jellyfinService.getPlaylistItems(jellyfinPlaylistId, limit, startIndex);

    return NextResponse.json(
      createPaginatedResponse(
        items,
        Math.floor(startIndex / limit) + 1,
        limit,
        items.length,
      ),
    );
  } catch (error) {
    console.error("Get playlist items API error:", error);
    return NextResponse.json(
      createErrorResponse(
        "PLAYLIST_ITEMS_FETCH_FAILED",
        "Failed to get playlist items",
      ),
      { status: 500 },
    );
  }
}
