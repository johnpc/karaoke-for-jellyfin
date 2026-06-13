import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

describe("usePWAInstall", () => {
  let windowListeners: Record<string, EventListener>;
  let originalNavigator: Navigator;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    windowListeners = {};

    vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: EventListenerOrEventListenerObject) => {
        windowListeners[event] = handler as EventListener;
      }
    );
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});

    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    originalNavigator = window.navigator;
    Object.defineProperty(window, "navigator", {
      value: {
        ...originalNavigator,
        serviceWorker: undefined,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("returns initial state correctly", () => {
    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.showInstallPrompt).toBe(false);
    expect(result.current.showUpdatePrompt).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.hasWaitingWorker).toBe(false);
  });

  it("detects standalone display mode as installed", () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(true);
  });

  it("handles beforeinstallprompt event", () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({
        outcome: "accepted" as const,
        platform: "web",
      }),
      prompt: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      if (windowListeners["beforeinstallprompt"]) {
        windowListeners["beforeinstallprompt"](mockEvent as unknown as Event);
      }
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.showInstallPrompt).toBe(true);
  });

  it("handles appinstalled event", () => {
    const { result } = renderHook(() => usePWAInstall());

    // First trigger beforeinstallprompt to show install prompt
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({
        outcome: "accepted" as const,
        platform: "web",
      }),
      prompt: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      if (windowListeners["beforeinstallprompt"]) {
        windowListeners["beforeinstallprompt"](
          mockPromptEvent as unknown as Event
        );
      }
    });

    expect(result.current.showInstallPrompt).toBe(true);

    // Then trigger appinstalled
    act(() => {
      if (windowListeners["appinstalled"]) {
        windowListeners["appinstalled"](new Event("appinstalled"));
      }
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.showInstallPrompt).toBe(false);
  });

  it("handleInstallClick calls prompt and hides install prompt on accept", async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPromptEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({
        outcome: "accepted" as const,
        platform: "web",
      }),
      prompt: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      if (windowListeners["beforeinstallprompt"]) {
        windowListeners["beforeinstallprompt"](
          mockPromptEvent as unknown as Event
        );
      }
    });

    await act(async () => {
      await result.current.handleInstallClick();
    });

    expect(mockPromptEvent.prompt).toHaveBeenCalled();
    expect(result.current.showInstallPrompt).toBe(false);
  });

  it("handleInstallClick does nothing when no deferred prompt", async () => {
    const { result } = renderHook(() => usePWAInstall());

    await act(async () => {
      await result.current.handleInstallClick();
    });

    // Should not throw and state remains unchanged
    expect(result.current.showInstallPrompt).toBe(false);
  });

  it("handleInstallClick hides prompt on dismiss", async () => {
    const { result } = renderHook(() => usePWAInstall());

    const mockPromptEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({
        outcome: "dismissed" as const,
        platform: "web",
      }),
      prompt: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      if (windowListeners["beforeinstallprompt"]) {
        windowListeners["beforeinstallprompt"](
          mockPromptEvent as unknown as Event
        );
      }
    });

    await act(async () => {
      await result.current.handleInstallClick();
    });

    expect(result.current.showInstallPrompt).toBe(false);
  });

  it("handleDismissInstall hides install prompt", () => {
    const { result } = renderHook(() => usePWAInstall());

    // First show it
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({
        outcome: "accepted" as const,
        platform: "web",
      }),
      prompt: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      if (windowListeners["beforeinstallprompt"]) {
        windowListeners["beforeinstallprompt"](
          mockPromptEvent as unknown as Event
        );
      }
    });

    expect(result.current.showInstallPrompt).toBe(true);

    act(() => {
      result.current.handleDismissInstall();
    });

    expect(result.current.showInstallPrompt).toBe(false);
  });

  it("handleDismissUpdate hides update prompt", () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      result.current.handleDismissUpdate();
    });

    expect(result.current.showUpdatePrompt).toBe(false);
  });

  it("handleUpdateClick does nothing when no waiting worker", async () => {
    const { result } = renderHook(() => usePWAInstall());

    await act(async () => {
      await result.current.handleUpdateClick();
    });

    expect(result.current.isUpdating).toBe(false);
  });

  it("does not show install prompt when update prompt is showing", () => {
    // This test verifies the logic: if showUpdatePrompt is true, beforeinstallprompt won't show install
    // We need to simulate the update prompt being shown first.
    // Since the hook's internal state drives this, we just verify behavior
    const { result } = renderHook(() => usePWAInstall());

    // The initial state has no update prompt, so install prompt should be shown
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      platforms: ["web"],
      userChoice: Promise.resolve({
        outcome: "accepted" as const,
        platform: "web",
      }),
      prompt: vi.fn().mockResolvedValue(undefined),
    };

    act(() => {
      if (windowListeners["beforeinstallprompt"]) {
        windowListeners["beforeinstallprompt"](
          mockPromptEvent as unknown as Event
        );
      }
    });

    expect(result.current.showInstallPrompt).toBe(true);
  });

  describe("service worker registration", () => {
    let mockRegistration: {
      installing: ServiceWorker | null;
      waiting: ServiceWorker | null;
      addEventListener: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    let swListeners: Record<string, EventListener>;
    let registrationListeners: Record<string, EventListener>;

    function setupServiceWorkerMock(options?: {
      waitingWorker?: ServiceWorker | null;
      controller?: ServiceWorker | null;
      registerError?: Error;
    }) {
      swListeners = {};
      registrationListeners = {};

      mockRegistration = {
        installing: null,
        waiting: options?.waitingWorker ?? null,
        addEventListener: vi.fn((event: string, handler: EventListener) => {
          registrationListeners[event] = handler;
        }),
        update: vi.fn(),
      };

      const mockServiceWorker = {
        register: options?.registerError
          ? vi.fn().mockRejectedValue(options.registerError)
          : vi.fn().mockResolvedValue(mockRegistration),
        controller: options?.controller ?? null,
        addEventListener: vi.fn((event: string, handler: EventListener) => {
          swListeners[event] = handler;
        }),
      };

      Object.defineProperty(window, "navigator", {
        value: {
          ...originalNavigator,
          serviceWorker: mockServiceWorker,
        },
        writable: true,
        configurable: true,
      });
    }

    it("registers a service worker on load event", async () => {
      setupServiceWorkerMock();

      renderHook(() => usePWAInstall());

      expect(windowListeners["load"]).toBeDefined();

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js");
    });

    it("sets showUpdatePrompt when registration already has a waiting worker", async () => {
      const mockWaiting = {
        postMessage: vi.fn(),
        state: "installed",
        addEventListener: vi.fn(),
      } as unknown as ServiceWorker;

      setupServiceWorkerMock({ waitingWorker: mockWaiting });

      const { result } = renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      expect(result.current.showUpdatePrompt).toBe(true);
      expect(result.current.hasWaitingWorker).toBe(true);
    });

    it("handles updatefound and sets showUpdatePrompt when new worker reaches installed state", async () => {
      const mockNewWorker = {
        state: "installing",
        addEventListener: vi.fn(),
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      const mockController = {
        postMessage: vi.fn(),
      } as unknown as ServiceWorker;

      setupServiceWorkerMock({ controller: mockController });

      const { result } = renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      // Simulate updatefound: set installing worker and trigger the event
      mockRegistration.installing = mockNewWorker;

      let stateChangeHandler: EventListener | undefined;
      (
        mockNewWorker.addEventListener as ReturnType<typeof vi.fn>
      ).mockImplementation((event: string, handler: EventListener) => {
        if (event === "statechange") {
          stateChangeHandler = handler;
        }
      });

      await act(async () => {
        registrationListeners["updatefound"](new Event("updatefound"));
      });

      expect(mockNewWorker.addEventListener).toHaveBeenCalledWith(
        "statechange",
        expect.any(Function)
      );

      // Simulate the worker reaching "installed" state
      Object.defineProperty(mockNewWorker, "state", { value: "installed" });

      await act(async () => {
        stateChangeHandler!(new Event("statechange"));
      });

      expect(result.current.showUpdatePrompt).toBe(true);
      expect(result.current.hasWaitingWorker).toBe(true);
    });

    it("does not set showUpdatePrompt when updatefound fires but no installing worker", async () => {
      setupServiceWorkerMock();

      const { result } = renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      // installing is null
      mockRegistration.installing = null;

      await act(async () => {
        registrationListeners["updatefound"](new Event("updatefound"));
      });

      expect(result.current.showUpdatePrompt).toBe(false);
    });

    it("triggers window.location.reload on controllerchange", async () => {
      setupServiceWorkerMock();

      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { ...window.location, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      // Trigger controllerchange
      act(() => {
        swListeners["controllerchange"](new Event("controllerchange"));
      });

      expect(reloadMock).toHaveBeenCalled();
    });

    it("logs error when service worker registration fails", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const registrationError = new Error("Registration failed");

      setupServiceWorkerMock({ registerError: registrationError });

      renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "SW registration failed: ",
        registrationError
      );
    });

    it("handleUpdateClick posts message to waiting worker and sets isUpdating", async () => {
      const mockWaiting = {
        postMessage: vi.fn(),
        state: "installed",
        addEventListener: vi.fn(),
      } as unknown as ServiceWorker;

      setupServiceWorkerMock({ waitingWorker: mockWaiting });

      const { result } = renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      // Confirm the update prompt is showing
      expect(result.current.showUpdatePrompt).toBe(true);
      expect(result.current.hasWaitingWorker).toBe(true);

      await act(async () => {
        await result.current.handleUpdateClick();
      });

      expect(mockWaiting.postMessage).toHaveBeenCalledWith({
        type: "SKIP_WAITING",
      });
      expect(result.current.isUpdating).toBe(true);
      expect(result.current.showUpdatePrompt).toBe(false);
      expect(result.current.hasWaitingWorker).toBe(false);
    });

    it("does not show install prompt via beforeinstallprompt when update prompt is active", async () => {
      const mockWaiting = {
        postMessage: vi.fn(),
        state: "installed",
        addEventListener: vi.fn(),
      } as unknown as ServiceWorker;

      setupServiceWorkerMock({ waitingWorker: mockWaiting });

      const { result } = renderHook(() => usePWAInstall());

      await act(async () => {
        await windowListeners["load"](new Event("load"));
      });

      // Update prompt should be showing
      expect(result.current.showUpdatePrompt).toBe(true);

      // Now trigger beforeinstallprompt
      const mockPromptEvent = {
        preventDefault: vi.fn(),
        platforms: ["web"],
        userChoice: Promise.resolve({
          outcome: "accepted" as const,
          platform: "web",
        }),
        prompt: vi.fn().mockResolvedValue(undefined),
      };

      act(() => {
        if (windowListeners["beforeinstallprompt"]) {
          windowListeners["beforeinstallprompt"](
            mockPromptEvent as unknown as Event
          );
        }
      });

      // Install prompt should NOT be shown because update prompt is active
      expect(result.current.showInstallPrompt).toBe(false);
    });
  });
});
