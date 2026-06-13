import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useLyrics } from "@/hooks/useLyrics";

function mockFetchResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

describe("useLyrics", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("returns default values when no options provided", () => {
      const { result } = renderHook(() => useLyrics());

      expect(result.current.lyricsFile).toBeNull();
      expect(result.current.syncState).toBeNull();
      expect(result.current.currentLine).toBe("♪ Instrumental ♪");
      expect(result.current.nextLine).toBe("");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("loadLyrics", () => {
    it("loads lyrics when songId is provided", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [
          { timestamp: 0, text: "First line" },
          { timestamp: 5000, text: "Second line" },
        ],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      const { result } = renderHook(() => useLyrics({ songId: "song_1" }));

      await waitFor(() => {
        expect(result.current.lyricsFile).toEqual(mockLyrics);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets loading state while fetching", async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      vi.mocked(fetch).mockImplementation(() =>
        pendingPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve({ success: true, data: null }),
        }))
      );

      const { result } = renderHook(() => useLyrics({ songId: "song_1" }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      act(() => {
        resolvePromise!(undefined);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("sets error when lyrics not found", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({
          success: false,
          error: { message: "Lyrics not available" },
        })
      );

      const { result } = renderHook(() => useLyrics({ songId: "song_1" }));

      await waitFor(() => {
        expect(result.current.error).toBe("Lyrics not available");
      });

      expect(result.current.lyricsFile).toBeNull();
    });

    it("sets default error message when no message in response", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: false })
      );

      const { result } = renderHook(() => useLyrics({ songId: "song_1" }));

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to load lyrics");
      });
    });

    it("handles fetch network error", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.reject(new Error("Network error"))
      );

      const { result } = renderHook(() => useLyrics({ songId: "song_1" }));

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to load lyrics");
      });

      expect(result.current.lyricsFile).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("encodes songId in fetch URL", async () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: null })
      );

      renderHook(() => useLyrics({ songId: "song with spaces" }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/lyrics/song%20with%20spaces");
      });
    });

    it("does not load lyrics when songId is empty", () => {
      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: null })
      );

      renderHook(() => useLyrics({ songId: "" }));

      expect(fetch).not.toHaveBeenCalled();
    });

    it("clears state when songId becomes undefined", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      const { result, rerender } = renderHook(
        ({ songId }) => useLyrics({ songId }),
        { initialProps: { songId: "song_1" as string | undefined } }
      );

      await waitFor(() => {
        expect(result.current.lyricsFile).toEqual(mockLyrics);
      });

      rerender({ songId: undefined });

      await waitFor(() => {
        expect(result.current.lyricsFile).toBeNull();
        expect(result.current.syncState).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe("syncLyrics", () => {
    it("syncs lyrics via POST request", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };
      const mockSyncState = {
        currentLine: 0,
        currentTimestamp: 5000,
        isActive: true,
        nextLine: { timestamp: 5000, text: "Next line" },
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() =>
          mockFetchResponse({ success: true, data: mockSyncState })
        );

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 5, autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.lyricsFile).toEqual(mockLyrics);
      });

      await waitFor(() => {
        expect(result.current.syncState).toEqual(mockSyncState);
      });
    });

    it("sends POST with currentTime in body", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() =>
          mockFetchResponse({ success: true, data: { currentLine: 0 } })
        );

      renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 10.5, autoSync: true })
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/lyrics/song_1",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentTime: 10.5 }),
          })
        );
      });
    });

    it("does not sync when autoSync is false", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 5, autoSync: false })
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1); // Only the loadLyrics GET call
      });
    });

    it("does not sync when currentTime is undefined", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      renderHook(() => useLyrics({ songId: "song_1", autoSync: true }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1); // Only the loadLyrics GET call
      });
    });

    it("handles sync error gracefully", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() => Promise.reject(new Error("Sync failed")));

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 5, autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.lyricsFile).toEqual(mockLyrics);
      });

      // Should not throw, just logs error
      expect(result.current.syncState).toBeNull();
    });
  });

  describe("currentLine", () => {
    it("returns instrumental when no lyrics file", () => {
      const { result } = renderHook(() => useLyrics());

      expect(result.current.currentLine).toBe("♪ Instrumental ♪");
    });

    it("returns instrumental when syncState is null", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line 1" }],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", autoSync: false })
      );

      await waitFor(() => {
        expect(result.current.lyricsFile).toEqual(mockLyrics);
      });

      expect(result.current.currentLine).toBe("♪ Instrumental ♪");
    });

    it("returns instrumental when currentLine index is negative", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line 1" }],
        format: "lrc",
      };
      const mockSyncState = {
        currentLine: -1,
        currentTimestamp: 0,
        isActive: true,
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() =>
          mockFetchResponse({ success: true, data: mockSyncState })
        );

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 0, autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.syncState).toEqual(mockSyncState);
      });

      expect(result.current.currentLine).toBe("♪ Instrumental ♪");
    });

    it("returns the correct line text from syncState", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [
          { timestamp: 0, text: "Hello world" },
          { timestamp: 5000, text: "Second line" },
        ],
        format: "lrc",
      };
      const mockSyncState = {
        currentLine: 1,
        currentTimestamp: 5000,
        isActive: true,
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() =>
          mockFetchResponse({ success: true, data: mockSyncState })
        );

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 5, autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.currentLine).toBe("Second line");
      });
    });
  });

  describe("nextLine", () => {
    it("returns empty string when syncState is null", () => {
      const { result } = renderHook(() => useLyrics());

      expect(result.current.nextLine).toBe("");
    });

    it("returns empty string when no nextLine in syncState", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Only line" }],
        format: "lrc",
      };
      const mockSyncState = {
        currentLine: 0,
        currentTimestamp: 0,
        isActive: true,
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() =>
          mockFetchResponse({ success: true, data: mockSyncState })
        );

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 0, autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.syncState).toEqual(mockSyncState);
      });

      expect(result.current.nextLine).toBe("");
    });

    it("returns next line text from syncState", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [
          { timestamp: 0, text: "Current" },
          { timestamp: 5000, text: "Upcoming" },
        ],
        format: "lrc",
      };
      const mockSyncState = {
        currentLine: 0,
        currentTimestamp: 0,
        isActive: true,
        nextLine: { timestamp: 5000, text: "Upcoming" },
      };

      vi.mocked(fetch)
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, data: mockLyrics })
        )
        .mockImplementation(() =>
          mockFetchResponse({ success: true, data: mockSyncState })
        );

      const { result } = renderHook(() =>
        useLyrics({ songId: "song_1", currentTime: 0, autoSync: true })
      );

      await waitFor(() => {
        expect(result.current.nextLine).toBe("Upcoming");
      });
    });
  });

  describe("clearLyrics", () => {
    it("resets all state", async () => {
      const mockLyrics = {
        songId: "song_1",
        lines: [{ timestamp: 0, text: "Line" }],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      const { result } = renderHook(() => useLyrics({ songId: "song_1" }));

      await waitFor(() => {
        expect(result.current.lyricsFile).toEqual(mockLyrics);
      });

      act(() => {
        result.current.clearLyrics();
      });

      expect(result.current.lyricsFile).toBeNull();
      expect(result.current.syncState).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("loadLyrics callback", () => {
    it("can be called manually", async () => {
      const mockLyrics = {
        songId: "song_2",
        lines: [{ timestamp: 0, text: "Manual load" }],
        format: "lrc",
      };

      vi.mocked(fetch).mockImplementation(() =>
        mockFetchResponse({ success: true, data: mockLyrics })
      );

      const { result } = renderHook(() => useLyrics());

      await act(async () => {
        await result.current.loadLyrics("song_2");
      });

      expect(result.current.lyricsFile).toEqual(mockLyrics);
      expect(fetch).toHaveBeenCalledWith("/api/lyrics/song_2");
    });

    it("does nothing when called with empty string", async () => {
      const { result } = renderHook(() => useLyrics());

      await act(async () => {
        await result.current.loadLyrics("");
      });

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("syncLyrics callback", () => {
    it("does nothing when time is negative", async () => {
      const { result } = renderHook(() => useLyrics());

      await act(async () => {
        await result.current.syncLyrics("song_1", -1);
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it("does nothing when songId is empty", async () => {
      const { result } = renderHook(() => useLyrics());

      await act(async () => {
        await result.current.syncLyrics("", 5);
      });

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
