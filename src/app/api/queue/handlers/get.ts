import { NextRequest, NextResponse } from "next/server";
import { getSessionManager } from "@/services/session";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function handleGet(_request: NextRequest): Promise<NextResponse> {
  try {
    const sessionManager = getSessionManager();
    const session = sessionManager.getSession();

    if (!session) {
      return NextResponse.json(
        createErrorResponse("SESSION_NOT_FOUND", "No active karaoke session"),
        { status: 404 }
      );
    }

    const queue = sessionManager.getQueue();
    const currentSong = sessionManager.getCurrentSong();
    const playbackState = sessionManager.getPlaybackState();
    const stats = sessionManager.getSessionStats();

    return NextResponse.json(
      createSuccessResponse({
        queue,
        currentSong,
        playbackState,
        stats,
        session: {
          id: session.id,
          name: session.name,
          connectedUsers: session.connectedUsers.length,
          hostControls: session.hostControls,
          settings: session.settings,
        },
      })
    );
  } catch (error) {
    console.error("Queue GET error:", error);
    return NextResponse.json(
      createErrorResponse("QUEUE_FETCH_FAILED", "Failed to fetch queue"),
      { status: 500 }
    );
  }
}
