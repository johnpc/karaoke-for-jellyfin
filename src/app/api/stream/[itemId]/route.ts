// API route to proxy audio streams from Jellyfin
import { NextRequest, NextResponse } from "next/server";
import { getJellyfinService } from "@/services/jellyfin";

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

    // Get the direct stream URL from Jellyfin (with proper auth)
    const streamUrl = await jellyfinService.getDirectStreamUrl(itemId);

    console.log("Proxying stream for item:", itemId);
    console.log("Direct stream URL:", streamUrl);

    // Fetch the audio stream from Jellyfin with proper authentication
    console.log("Fetching from Jellyfin with URL:", streamUrl);
    const response = await fetch(streamUrl, {
      headers: {
        "X-Emby-Token": process.env.JELLYFIN_API_KEY || "",
        "User-Agent": "Karaoke-For-Jellyfin/1.0",
        Accept: "audio/*,*/*;q=0.9",
      },
    });

    console.log("Jellyfin response status:", response.status);
    console.log(
      "Jellyfin response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch stream from Jellyfin:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Jellyfin error response:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch audio stream" },
        { status: response.status }
      );
    }

    // Get the content type from Jellyfin response
    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const contentLength = response.headers.get("content-length");

    console.log("Response content-type:", contentType);
    console.log("Response content-length:", contentLength);
    console.log("Response body exists:", !!response.body);
    console.log("Response body locked:", response.bodyUsed);

    // Create headers for the proxied response
    const headers = new Headers({
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Range, Content-Length",
      "Cache-Control": "public, max-age=3600",
    });

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    // Handle range requests for audio seeking
    const range = request.headers.get("range");
    if (range) {
      headers.set("Accept-Ranges", "bytes");

      // Forward the range request to Jellyfin with authentication
      const rangeResponse = await fetch(streamUrl, {
        headers: {
          Range: range,
          "X-Emby-Token": process.env.JELLYFIN_API_KEY || "",
          "User-Agent": "Karaoke-For-Jellyfin/1.0",
        },
      });

      if (rangeResponse.status === 206) {
        const contentRange = rangeResponse.headers.get("content-range");
        if (contentRange) {
          headers.set("Content-Range", contentRange);
        }

        return new NextResponse(rangeResponse.body, {
          status: 206,
          headers,
        });
      }
    }

    // Return the proxied audio stream
    console.log("Returning response with body:", !!response.body);

    // Try buffering the response to ensure it's properly loaded
    if (!response.body) {
      console.error("No response body from Jellyfin");
      return NextResponse.json(
        { error: "No audio data received from Jellyfin" },
        { status: 502 }
      );
    }

    // Buffer the response to avoid streaming issues
    const audioBuffer = await response.arrayBuffer();
    console.log("Audio buffer size:", audioBuffer.byteLength);

    if (audioBuffer.byteLength === 0) {
      console.error("Empty audio buffer received from Jellyfin");
      return NextResponse.json(
        { error: "Empty audio data received from Jellyfin" },
        { status: 502 }
      );
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Stream proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Range, Content-Length",
    },
  });
}
