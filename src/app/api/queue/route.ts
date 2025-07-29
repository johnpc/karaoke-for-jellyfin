// API route for queue management
import { NextRequest, NextResponse } from "next/server";
import { getSessionManager } from "@/services/session";
import {
  validateMediaItem,
  validateUserName,
  ValidationError,
} from "@/lib/validation";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, mediaItem, userId, userName, position } = body;

    if (!action) {
      return NextResponse.json(
        createErrorResponse("INVALID_REQUEST", "Action is required"),
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();

    switch (action) {
      case "create-session":
        if (!userName) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "userName is required for creating session"
            ),
            { status: 400 }
          );
        }

        try {
          const validatedUserName = validateUserName(userName);
          const session = sessionManager.createSession(
            "Karaoke Session",
            validatedUserName
          );

          return NextResponse.json(
            createSuccessResponse({
              session,
              message: "Session created successfully",
            })
          );
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              createErrorResponse("SESSION_EXISTS", error.message),
              { status: 409 }
            );
          }
          throw error;
        }

      case "join-session":
        if (!userName) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "userName is required for joining session"
            ),
            { status: 400 }
          );
        }

        try {
          const validatedUserName = validateUserName(userName);
          let session = sessionManager.getSession();

          if (!session) {
            // Create session if none exists
            session = sessionManager.createSession(
              "Karaoke Session",
              validatedUserName
            );
          } else {
            // Add user to existing session
            sessionManager.addUser(validatedUserName);
          }

          return NextResponse.json(
            createSuccessResponse({
              session: sessionManager.getSession(),
              queue: sessionManager.getQueue(),
              currentSong: sessionManager.getCurrentSong(),
              playbackState: sessionManager.getPlaybackState(),
              message: "Joined session successfully",
            })
          );
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              createErrorResponse("JOIN_FAILED", error.message),
              { status: 400 }
            );
          }
          throw error;
        }

      case "add-song":
        if (!mediaItem || !userId) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "mediaItem and userId are required"
            ),
            { status: 400 }
          );
        }

        try {
          const validatedMediaItem = validateMediaItem(mediaItem);
          const result = sessionManager.addSongToQueue(
            validatedMediaItem,
            userId,
            position
          );

          if (!result.success) {
            return NextResponse.json(
              createErrorResponse("ADD_SONG_FAILED", result.message),
              { status: 400 }
            );
          }

          return NextResponse.json(
            createSuccessResponse({
              queueItem: result.queueItem,
              queue: result.newQueue,
              message: result.message,
            })
          );
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              createErrorResponse("VALIDATION_ERROR", error.message),
              { status: 400 }
            );
          }
          throw error;
        }

      default:
        return NextResponse.json(
          createErrorResponse("INVALID_ACTION", `Unknown action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Queue POST error:", error);
    return NextResponse.json(
      createErrorResponse(
        "QUEUE_OPERATION_FAILED",
        "Failed to perform queue operation"
      ),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queueItemId = searchParams.get("itemId");
    const userId = searchParams.get("userId");

    if (!queueItemId || !userId) {
      return NextResponse.json(
        createErrorResponse(
          "INVALID_REQUEST",
          "itemId and userId are required"
        ),
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();
    const result = sessionManager.removeSongFromQueue(queueItemId, userId);

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse("REMOVE_SONG_FAILED", result.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        queue: result.newQueue,
        message: result.message,
      })
    );
  } catch (error) {
    console.error("Queue DELETE error:", error);
    return NextResponse.json(
      createErrorResponse(
        "QUEUE_DELETE_FAILED",
        "Failed to remove song from queue"
      ),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queueItemId, newPosition, userId } = body;

    if (!action || !userId) {
      return NextResponse.json(
        createErrorResponse(
          "INVALID_REQUEST",
          "action and userId are required"
        ),
        { status: 400 }
      );
    }

    const sessionManager = getSessionManager();

    switch (action) {
      case "reorder":
        if (!queueItemId || newPosition === undefined) {
          return NextResponse.json(
            createErrorResponse(
              "INVALID_REQUEST",
              "queueItemId and newPosition are required for reorder"
            ),
            { status: 400 }
          );
        }

        const result = sessionManager.reorderQueue(
          queueItemId,
          newPosition,
          userId
        );

        if (!result.success) {
          return NextResponse.json(
            createErrorResponse("REORDER_FAILED", result.message),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createSuccessResponse({
            queue: result.newQueue,
            message: result.message,
          })
        );

      case "skip":
        const skipResult = sessionManager.skipCurrentSong(userId);

        if (!skipResult.success) {
          return NextResponse.json(
            createErrorResponse("SKIP_FAILED", skipResult.message),
            { status: 400 }
          );
        }

        return NextResponse.json(
          createSuccessResponse({
            message: skipResult.message,
            currentSong: sessionManager.getCurrentSong(),
            playbackState: sessionManager.getPlaybackState(),
          })
        );

      default:
        return NextResponse.json(
          createErrorResponse("INVALID_ACTION", `Unknown action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Queue PUT error:", error);
    return NextResponse.json(
      createErrorResponse("QUEUE_UPDATE_FAILED", "Failed to update queue"),
      { status: 500 }
    );
  }
}
