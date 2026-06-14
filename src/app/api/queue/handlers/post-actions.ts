import { NextResponse } from "next/server";
import { getSessionManager } from "@/services/session";
import { validateMediaItem, validateUserName } from "@/lib/validation";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils";

export function handleCreateSession(userName: string): NextResponse {
  const sessionManager = getSessionManager();
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
}

export function handleJoinSession(userName: string): NextResponse {
  const sessionManager = getSessionManager();
  const validatedUserName = validateUserName(userName);
  let session = sessionManager.getSession();

  if (!session) {
    session = sessionManager.createSession(
      "Karaoke Session",
      validatedUserName
    );
  } else {
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
}

export function handleAddSong(
  mediaItem: unknown,
  userId: string,
  position?: number
): NextResponse {
  const sessionManager = getSessionManager();
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
}
