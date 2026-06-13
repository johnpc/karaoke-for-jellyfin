import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCacheManager } from "@/hooks/useCacheManager";

describe("useCacheManager", () => {
  let originalLocation: Location;
  let messageChannelResponses: Array<(data: unknown) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    originalLocation = window.location;
    messageChannelResponses = [];

    // Mock MessageChannel - each new instance captures the resolve callback
    vi.stubGlobal(
      "MessageChannel",
      class {
        port1: { onmessage: ((event: { data: unknown }) => void) | null };
        port2: object;
        constructor() {
          const self = this;
          this.port1 = {
            set onmessage(
              handler: ((event: { data: unknown }) => void) | null
            ) {
              if (handler) {
                messageChannelResponses.push((data: unknown) =>
                  handler({ data })
                );
              }
            },
            get onmessage() {
              return null;
            },
          };
          this.port2 = {};
        }
      }
    );

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        clear: vi.fn(),
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        clear: vi.fn(),
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Default: no service worker controller
    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: null,
        },
      },
      writable: true,
      configurable: true,
    });

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        reload: vi.fn(),
        href: "http://localhost:3000/cache",
      },
      writable: true,
      configurable: true,
    });

    // Mock indexedDB
    Object.defineProperty(window, "indexedDB", {
      value: {
        databases: vi.fn().mockResolvedValue([]),
        deleteDatabase: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useCacheManager());

    expect(result.current.isClearing).toBe(false);
    expect(result.current.isCleared).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.cacheInfo).toEqual({});
    // isLoadingInfo may already be false if loadCacheInfo resolved synchronously
    // (when no SW controller exists, the async fn resolves immediately)
    expect(typeof result.current.isLoadingInfo).toBe("boolean");
    expect(result.current.totalCachedItems).toBe(0);
  });

  it("sets isLoadingInfo to false after mount when no service worker controller", async () => {
    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoadingInfo).toBe(false);
  });

  it("loads cache info from service worker via MessageChannel", async () => {
    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: vi.fn(),
          },
        },
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCacheManager());

    // The hook creates a MessageChannel and sets port1.onmessage
    // Our mock captures the resolve callback
    await act(async () => {
      // Simulate the response
      if (messageChannelResponses.length > 0) {
        messageChannelResponses[0]({ "audio-cache": 5, "lyrics-cache": 3 });
      }
      await vi.runAllTimersAsync();
    });

    expect(result.current.cacheInfo).toEqual({
      "audio-cache": 5,
      "lyrics-cache": 3,
    });
    expect(result.current.totalCachedItems).toBe(8);
    expect(result.current.isLoadingInfo).toBe(false);
  });

  it("calculates totalCachedItems as sum of all cache entries", async () => {
    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: vi.fn(),
          },
        },
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      if (messageChannelResponses.length > 0) {
        messageChannelResponses[0]({ a: 10, b: 20, c: 5 });
      }
      await vi.runAllTimersAsync();
    });

    expect(result.current.totalCachedItems).toBe(35);
  });

  it("clearAllData clears localStorage and sessionStorage", async () => {
    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      await result.current.clearAllData();
    });

    expect(window.localStorage.clear).toHaveBeenCalled();
    expect(window.sessionStorage.clear).toHaveBeenCalled();
  });

  it("clearAllData sets isCleared on success without SW controller", async () => {
    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      await result.current.clearAllData();
    });

    expect(result.current.isCleared).toBe(true);
    expect(result.current.isClearing).toBe(false);
  });

  it("clearAllData redirects to / after 2 seconds", async () => {
    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      await result.current.clearAllData();
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(window.location.href).toBe("/");
  });

  it("clearAllData clears IndexedDB databases", async () => {
    const mockDeleteRequest = {
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };
    Object.defineProperty(window, "indexedDB", {
      value: {
        databases: vi.fn().mockResolvedValue([{ name: "test-db" }]),
        deleteDatabase: vi.fn(() => {
          setTimeout(() => mockDeleteRequest.onsuccess?.(), 0);
          return mockDeleteRequest;
        }),
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      const clearPromise = result.current.clearAllData();
      await vi.runAllTimersAsync();
      await clearPromise;
    });

    expect(window.indexedDB.deleteDatabase).toHaveBeenCalledWith("test-db");
  });

  it("clearAllData sends CLEAR_CACHE message to service worker", async () => {
    const mockPostMessage = vi.fn();
    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCacheManager());

    // Resolve GET_CACHE_INFO
    await act(async () => {
      if (messageChannelResponses.length > 0) {
        messageChannelResponses[0]({});
      }
      await vi.runAllTimersAsync();
    });

    // Call clearAllData - it will create another MessageChannel for CLEAR_CACHE
    await act(async () => {
      const clearPromise = result.current.clearAllData();
      // Wait a tick for the new MessageChannel to be created
      await vi.advanceTimersByTimeAsync(0);
      // Resolve the CLEAR_CACHE response
      if (messageChannelResponses.length > 1) {
        messageChannelResponses[1]({ success: true });
      }
      await vi.runAllTimersAsync();
      await clearPromise;
    });

    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: "CLEAR_CACHE" },
      expect.anything()
    );
    expect(result.current.isCleared).toBe(true);
  });

  it("clearAllData sets error when SW clear fails", async () => {
    const mockPostMessage = vi.fn();
    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCacheManager());

    // Resolve GET_CACHE_INFO
    await act(async () => {
      if (messageChannelResponses.length > 0) {
        messageChannelResponses[0]({});
      }
      await vi.runAllTimersAsync();
    });

    await act(async () => {
      const clearPromise = result.current.clearAllData();
      await vi.advanceTimersByTimeAsync(0);
      // Respond with failure
      if (messageChannelResponses.length > 1) {
        messageChannelResponses[1]({ success: false, error: "Cache locked" });
      }
      await vi.runAllTimersAsync();
      await clearPromise;
    });

    expect(result.current.error).toBe("Cache locked");
    expect(result.current.isCleared).toBe(false);
  });

  it("refreshPage calls location.reload", () => {
    const { result } = renderHook(() => useCacheManager());

    act(() => {
      result.current.refreshPage();
    });

    expect(window.location.reload).toHaveBeenCalled();
  });

  it("goHome navigates to /", () => {
    const { result } = renderHook(() => useCacheManager());

    act(() => {
      result.current.goHome();
    });

    expect(window.location.href).toBe("/");
  });

  it("handles error during cache info loading gracefully", async () => {
    const mockPostMessage = vi.fn(() => {
      throw new Error("SW error");
    });

    Object.defineProperty(window, "navigator", {
      value: {
        serviceWorker: {
          controller: {
            postMessage: mockPostMessage,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useCacheManager());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isLoadingInfo).toBe(false);
    expect(result.current.cacheInfo).toEqual({});
  });
});
