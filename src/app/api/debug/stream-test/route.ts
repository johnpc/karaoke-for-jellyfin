// Debug endpoint to test stream URLs
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

    // Get stream URL
    const streamUrl = await jellyfinService.getDirectStreamUrl(itemId);

    // Test if the stream URL is accessible
    const testResponse = await fetch(streamUrl, {
      method: "HEAD", // Just check headers, don't download content
      headers: {
        "X-Emby-Token": process.env.JELLYFIN_API_KEY || "",
        "User-Agent": "Karaoke-For-Jellyfin/1.0",
      },
    });

    return NextResponse.json({
      itemId,
      streamUrl,
      accessible: testResponse.ok,
      status: testResponse.status,
      statusText: testResponse.statusText,
      contentType: testResponse.headers.get("content-type"),
      contentLength: testResponse.headers.get("content-length"),
      headers: Object.fromEntries(testResponse.headers.entries()),
    });
  } catch (error) {
    console.error("Stream test error:", error);
    return NextResponse.json(
      {
        error: "Stream test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
