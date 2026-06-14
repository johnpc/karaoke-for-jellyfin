"use client";

import { useEffect, useState, useCallback } from "react";
import {
  clearServiceWorkerCache,
  getServiceWorkerCacheInfo,
} from "./serviceWorkerHelpers";

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

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          setState(prev => ({ ...prev, isUpdating: false }));
          window.location.reload();
        });

        if (registration.waiting) {
          setState(prev => ({
            ...prev,
            isUpdateAvailable: true,
            waitingWorker: registration.waiting,
          }));
        }

        const updateInterval = setInterval(() => {
          registration.update();
        }, 60000);

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

  const clearCache = useCallback(clearServiceWorkerCache, []);

  const getCacheInfo = useCallback(getServiceWorkerCacheInfo, []);

  const forceRefresh = useCallback(() => {
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
