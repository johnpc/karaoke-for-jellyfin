import { NextRequest, NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Range, Content-Length",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const jellyfinService = getJellyfinService();
    const streamUrl = await jellyfinService.getDirectStreamUrl(itemId);

    const range = request.headers.get("range");

    const fetchHeaders: Record<string, string> = {
      "X-Emby-Token": process.env.JELLYFIN_API_KEY || "",
      "User-Agent": "Karaoke-For-Jellyfin/1.0",
    };

    if (range) {
      fetchHeaders["Range"] = range;
    }

    const response = await fetch(streamUrl, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      return NextResponse.json(
        { error: "Failed to fetch audio stream" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");

    const headers = new Headers({
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      ...CORS_HEADERS,
    });

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    if (response.status === 206 && contentRange) {
      headers.set("Content-Range", contentRange);
      return new NextResponse(response.body, { status: 206, headers });
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No audio data received from Jellyfin" },
        { status: 502 }
      );
    }

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Stream proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
