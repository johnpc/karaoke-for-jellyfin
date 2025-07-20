// Integration tests for queue API endpoints
import { NextRequest } from "next/server";
import { GET, POST, DELETE, PUT } from "@/app/api/queue/route";
import { getSessionManager } from "@/services/session";
import { MediaItem } from "@/types";

// Mock the session manager
jest.mock("@/services/session", () => ({
  getSessionManager: jest.fn(),
}));

describe("/api/queue", () => {
  let mockSessionManager: any;
  let mockMediaItem: MediaItem;

  beforeEach(() => {
    mockSessionManager = {
      getSession: jest.fn(),
      createSession: jest.fn(),
      addUser: jest.fn(),
      getQueue: jest.fn(),
      getCurrentSong: jest.fn(),
      getPlaybackState: jest.fn(),
      getSessionStats: jest.fn(),
      addSongToQueue: jest.fn(),
      removeSongFromQueue: jest.fn(),
      reorderQueue: jest.fn(),
      skipCurrentSong: jest.fn(),
    };
    (getSessionManager as jest.Mock).mockReturnValue(mockSessionManager);

    mockMediaItem = {
      id: "media_123",
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      jellyfinId: "jellyfin_123",
      streamUrl: "http://test.com/stream/123",
    };
  });

  describe("GET /api/queue", () => {
    it("should return queue data when session exists", async () => {
      const mockSession = {
        id: "session_123",
        name: "Test Session",
        connectedUsers: [{ id: "user_1", name: "Test User" }],
        hostControls: { autoAdvance: true },
        settings: { maxUsers: 10 },
      };

      const mockQueue = [
        {
          id: "queue_1",
          mediaItem: mockMediaItem,
          addedBy: "user_1",
          addedAt: new Date(),
          position: 0,
          status: "pending",
        },
      ];

      mockSessionManager.getSession.mockReturnValue(mockSession);
      mockSessionManager.getQueue.mockReturnValue(mockQueue);
      mockSessionManager.getCurrentSong.mockReturnValue(null);
      mockSessionManager.getPlaybackState.mockReturnValue({ isPlaying: false });
      mockSessionManager.getSessionStats.mockReturnValue({ totalSongs: 1 });

      const request = new NextRequest("http://localhost:3000/api/queue");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.queue).toEqual(mockQueue);
      expect(data.data.session.id).toBe("session_123");
    });

    it("should return 404 when no session exists", async () => {
      mockSessionManager.getSession.mockReturnValue(null);

      const request = new NextRequest("http://localhost:3000/api/queue");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("SESSION_NOT_FOUND");
    });
  });

  describe("POST /api/queue", () => {
    it("should create a new session", async () => {
      const mockSession = {
        id: "session_123",
        name: "Karaoke Session",
        connectedUsers: [{ id: "user_1", name: "Test User", isHost: true }],
      };

      mockSessionManager.createSession.mockReturnValue(mockSession);

      const request = new NextRequest("http://localhost:3000/api/queue", {
        method: "POST",
        body: JSON.stringify({
          action: "create-session",
          userName: "Test User",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.session.id).toBe("session_123");
      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        "Karaoke Session",
        "Test User",
      );
    });

    it("should join an existing session", async () => {
      const mockSession = {
        id: "session_123",
        name: "Karaoke Session",
        connectedUsers: [
          { id: "user_1", name: "Host" },
          { id: "user_2", name: "Test User" },
        ],
      };

      mockSessionManager.getSession.mockReturnValue(mockSession);
      mockSessionManager.addUser.mockReturnValue({
        id: "user_2",
        name: "Test User",
      });
      mockSessionManager.getQueue.mockReturnValue([]);
      mockSessionManager.getCurrentSong.mockReturnValue(null);
      mockSessionManager.getPlaybackState.mockReturnValue({ isPlaying: false });

      const request = new NextRequest("http://localhost:3000/api/queue", {
        method: "POST",
        body: JSON.stringify({
          action: "join-session",
          userName: "Test User",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Joined session successfully");
      expect(mockSessionManager.addUser).toHaveBeenCalledWith("Test User");
    });

    it("should add a song to the queue", async () => {
      const mockResult = {
        success: true,
        message: "Song added to queue",
        queueItem: {
          id: "queue_1",
          mediaItem: mockMediaItem,
          addedBy: "user_1",
          status: "pending",
        },
        newQueue: [],
      };

      mockSessionManager.addSongToQueue.mockReturnValue(mockResult);

      const request = new NextRequest("http://localhost:3000/api/queue", {
        method: "POST",
        body: JSON.stringify({
          action: "add-song",
          mediaItem: mockMediaItem,
          userId: "user_1",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.queueItem.id).toBe("queue_1");
      expect(mockSessionManager.addSongToQueue).toHaveBeenCalledWith(
        mockMediaItem,
        "user_1",
        undefined,
      );
    });

    it("should return error for invalid action", async () => {
      const request = new NextRequest("http://localhost:3000/api/queue", {
        method: "POST",
        body: JSON.stringify({
          action: "invalid-action",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_ACTION");
    });
  });

  describe("DELETE /api/queue", () => {
    it("should remove a song from the queue", async () => {
      const mockResult = {
        success: true,
        message: "Song removed from queue",
        newQueue: [],
      };

      mockSessionManager.removeSongFromQueue.mockReturnValue(mockResult);

      const request = new NextRequest(
        "http://localhost:3000/api/queue?itemId=queue_1&userId=user_1",
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Song removed from queue");
      expect(mockSessionManager.removeSongFromQueue).toHaveBeenCalledWith(
        "queue_1",
        "user_1",
      );
    });

    it("should return error when parameters are missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/queue");
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_REQUEST");
    });
  });

  describe("PUT /api/queue", () => {
    it("should reorder the queue", async () => {
      const mockResult = {
        success: true,
        message: "Queue reordered",
        newQueue: [],
      };

      mockSessionManager.reorderQueue.mockReturnValue(mockResult);

      const request = new NextRequest("http://localhost:3000/api/queue", {
        method: "PUT",
        body: JSON.stringify({
          action: "reorder",
          queueItemId: "queue_1",
          newPosition: 2,
          userId: "user_1",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Queue reordered");
      expect(mockSessionManager.reorderQueue).toHaveBeenCalledWith(
        "queue_1",
        2,
        "user_1",
      );
    });

    it("should skip the current song", async () => {
      const mockResult = {
        success: true,
        message: "Song skipped",
      };

      mockSessionManager.skipCurrentSong.mockReturnValue(mockResult);
      mockSessionManager.getCurrentSong.mockReturnValue(null);
      mockSessionManager.getPlaybackState.mockReturnValue({ isPlaying: false });

      const request = new NextRequest("http://localhost:3000/api/queue", {
        method: "PUT",
        body: JSON.stringify({
          action: "skip",
          userId: "user_1",
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe("Song skipped");
      expect(mockSessionManager.skipCurrentSong).toHaveBeenCalledWith("user_1");
    });
  });
});
