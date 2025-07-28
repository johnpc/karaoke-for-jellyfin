"use client";

import { useEffect, useState, useCallback } from "react";

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
  waitingWorker: ServiceWorker | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    isUpdating: false,
    registration: null,
    waitingWorker: null,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setState(prev => ({
                  ...prev,
                  isUpdateAvailable: true,
                  waitingWorker: newWorker,
                }));
              }
            });
          }
        });

        // Listen for controlling service worker changes
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          setState(prev => ({ ...prev, isUpdating: false }));
          window.location.reload();
        });

        // Check for waiting service worker
        if (registration.waiting) {
          setState(prev => ({
            ...prev,
            isUpdateAvailable: true,
            waitingWorker: registration.waiting,
          }));
        }

        // Check for updates periodically
        const updateInterval = setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        return () => clearInterval(updateInterval);
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (state.waitingWorker) {
      setState(prev => ({ ...prev, isUpdating: true }));
      state.waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [state.waitingWorker]);

  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!navigator.serviceWorker.controller) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();

      const clearPromise = new Promise<{ success: boolean; error?: string }>(
        resolve => {
          messageChannel.port1.onmessage = event => {
            resolve(event.data);
          };
        }
      );

      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" }, [
        messageChannel.port2,
      ]);

      const result = await clearPromise;
      return result.success;
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return false;
    }
  }, []);

  const getCacheInfo = useCallback(async (): Promise<
    Record<string, number>
  > => {
    if (!navigator.serviceWorker.controller) {
      return {};
    }

    try {
      const messageChannel = new MessageChannel();

      const infoPromise = new Promise<Record<string, number>>(resolve => {
        messageChannel.port1.onmessage = event => {
          resolve(event.data);
        };
      });

      navigator.serviceWorker.controller.postMessage(
        { type: "GET_CACHE_INFO" },
        [messageChannel.port2]
      );

      return await infoPromise;
    } catch (error) {
      console.error("Failed to get cache info:", error);
      return {};
    }
  }, []);

  const forceRefresh = useCallback(() => {
    // Clear all storage and reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }, []);

  return {
    ...state,
    updateServiceWorker,
    clearCache,
    getCacheInfo,
    forceRefresh,
  };
}
