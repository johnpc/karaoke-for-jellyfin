import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useServiceWorker } from "@/hooks/useServiceWorker";

describe("useServiceWorker", () => {
  let mockRegistration: Partial<ServiceWorkerRegistration>;
  let updateFoundListeners: Array<() => void>;
  let controllerChangeListeners: Array<() => void>;

  beforeEach(() => {
    vi.resetAllMocks();
    updateFoundListeners = [];
    controllerChangeListeners = [];

    mockRegistration = {
      installing: null,
      waiting: null,
      active: null,
      update: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "updatefound") {
          updateFoundListeners.push(handler);
        }
      }),
      removeEventListener: vi.fn(),
    };

    // Use vi.stubGlobal for proper JSDOM-compatible mocking
    const mockServiceWorker = {
      register: vi.fn().mockResolvedValue(mockRegistration),
      controller: null as ServiceWorker | null,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "controllerchange") {
          controllerChangeListeners.push(handler);
        }
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, "navigator", {
      value: { serviceWorker: mockServiceWorker },
      writable: true,
      configurable: true,
    });

    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      value: { reload: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("returns initial state with isSupported true when serviceWorker exists", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
    });

    it("returns isSupported false when serviceWorker not in navigator", () => {
      Object.defineProperty(window, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isSupported).toBe(false);
      expect(result.current.isRegistered).toBe(false);
    });

    it("returns correct initial default values", () => {
      Object.defineProperty(window, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useServiceWorker());

      expect(result.current.isSupported).toBe(false);
      expect(result.current.isRegistered).toBe(false);
      expect(result.current.isUpdateAvailable).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.registration).toBeNull();
      expect(result.current.waitingWorker).toBeNull();
    });
  });

  describe("registration", () => {
    it("registers service worker at /sw.js", async () => {
      renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
      });
    });

    it("sets isRegistered true after successful registration", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      expect(result.current.registration).toBe(mockRegistration);
    });

    it("handles registration failure gracefully", async () => {
      (
        navigator.serviceWorker.register as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Registration failed"));

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Service worker registration failed:",
          expect.any(Error)
        );
      });

      expect(result.current.isRegistered).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("update detection", () => {
    it("detects waiting service worker on registration", async () => {
      const waitingWorker = { state: "installed" } as ServiceWorker;
      mockRegistration.waiting = waitingWorker;

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isUpdateAvailable).toBe(true);
        expect(result.current.waitingWorker).toBe(waitingWorker);
      });
    });

    it("detects update via updatefound event", async () => {
      const newWorker = {
        state: "installing" as ServiceWorkerState,
        addEventListener: vi.fn(),
      };
      mockRegistration.installing = newWorker as unknown as ServiceWorker;

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      // Simulate updatefound
      act(() => {
        updateFoundListeners.forEach(listener => listener());
      });

      // Get the statechange listener that was registered
      const statechangeHandler = (
        newWorker.addEventListener as ReturnType<typeof vi.fn>
      ).mock.calls.find(
        (call: [string, () => void]) => call[0] === "statechange"
      )?.[1];

      // Simulate worker installed with existing controller
      (
        navigator.serviceWorker as unknown as Record<string, unknown>
      ).controller = {} as ServiceWorker;
      newWorker.state = "installed";

      act(() => {
        if (statechangeHandler) statechangeHandler();
      });

      await waitFor(() => {
        expect(result.current.isUpdateAvailable).toBe(true);
      });
    });

    it("checks for updates periodically", async () => {
      vi.useFakeTimers();

      renderHook(() => useServiceWorker());

      // Advance past the registration Promise
      await vi.advanceTimersByTimeAsync(0);

      expect(mockRegistration.update).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(60000);

      expect(mockRegistration.update).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(60000);

      expect(mockRegistration.update).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe("updateServiceWorker", () => {
    it("posts SKIP_WAITING message to waiting worker", async () => {
      const waitingWorker = {
        state: "installed",
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;
      mockRegistration.waiting = waitingWorker;

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isUpdateAvailable).toBe(true);
      });

      act(() => {
        result.current.updateServiceWorker();
      });

      expect(result.current.isUpdating).toBe(true);
      expect(
        (waitingWorker as unknown as { postMessage: ReturnType<typeof vi.fn> })
          .postMessage
      ).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    });

    it("does nothing when no waiting worker", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      act(() => {
        result.current.updateServiceWorker();
      });

      expect(result.current.isUpdating).toBe(false);
    });
  });

  describe("clearCache", () => {
    it("returns false when no controller", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let clearResult: boolean = true;
      await act(async () => {
        clearResult = await result.current.clearCache();
      });

      expect(clearResult).toBe(false);
    });

    it("returns false when postMessage throws", async () => {
      const mockController = {
        postMessage: vi.fn().mockImplementation(() => {
          throw new Error("Post message failed");
        }),
      };

      // Set up navigator with controller from the start
      Object.defineProperty(window, "navigator", {
        value: {
          serviceWorker: {
            register: vi.fn().mockResolvedValue(mockRegistration),
            controller: mockController,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let clearResult: boolean = true;
      await act(async () => {
        clearResult = await result.current.clearCache();
      });

      expect(clearResult).toBe(false);
      expect(mockController.postMessage).toHaveBeenCalledWith(
        { type: "CLEAR_CACHE" },
        expect.anything()
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getCacheInfo", () => {
    it("returns empty object when no controller", async () => {
      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let info: Record<string, number> = { something: 1 };
      await act(async () => {
        info = await result.current.getCacheInfo();
      });

      expect(info).toEqual({});
    });

    it("returns empty object when postMessage throws", async () => {
      const mockController = {
        postMessage: vi.fn().mockImplementation(() => {
          throw new Error("Failed");
        }),
      };

      Object.defineProperty(window, "navigator", {
        value: {
          serviceWorker: {
            register: vi.fn().mockResolvedValue(mockRegistration),
            controller: mockController,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          },
        },
        writable: true,
        configurable: true,
      });

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useServiceWorker());

      await waitFor(() => {
        expect(result.current.isRegistered).toBe(true);
      });

      let info: Record<string, number> = { something: 1 };
      await act(async () => {
        info = await result.current.getCacheInfo();
      });

      expect(info).toEqual({});
      expect(mockController.postMessage).toHaveBeenCalledWith(
        { type: "GET_CACHE_INFO" },
        expect.anything()
      );
      consoleSpy.mockRestore();
    });
  });

  describe("forceRefresh", () => {
    it("clears localStorage, sessionStorage, and reloads", async () => {
      const localStorageClearSpy = vi.spyOn(Storage.prototype, "clear");

      const { result } = renderHook(() => useServiceWorker());

      act(() => {
        result.current.forceRefresh();
      });

      expect(localStorageClearSpy).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();

      localStorageClearSpy.mockRestore();
    });
  });
});
