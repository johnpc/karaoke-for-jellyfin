"use client";

import { useState, useEffect } from "react";
import {
  CacheInfo,
  CacheManagerState,
  CacheManagerActions,
} from "./cacheManagerTypes";

export type { CacheInfo, CacheManagerState, CacheManagerActions };

export function useCacheManager(): CacheManagerState & CacheManagerActions {
  const [isClearing, setIsClearing] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({});
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    setIsLoadingInfo(true);
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();

        const infoPromise = new Promise<CacheInfo>(resolve => {
          messageChannel.port1.onmessage = event => {
            resolve(event.data);
          };
        });

        navigator.serviceWorker.controller.postMessage(
          { type: "GET_CACHE_INFO" },
          [messageChannel.port2]
        );

        const info = await infoPromise;
        setCacheInfo(info);
      }
    } catch (err) {
      console.error("Failed to load cache info:", err);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const clearAllData = async () => {
    setIsClearing(true);
    setError(null);
    setIsCleared(false);

    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();

        const clearPromise = new Promise<{ success: boolean; error?: string }>(
          resolve => {
            messageChannel.port1.onmessage = event => {
              resolve(event.data);
            };
          }
        );

        navigator.serviceWorker.controller.postMessage(
          { type: "CLEAR_CACHE" },
          [messageChannel.port2]
        );

        const result = await clearPromise;
        if (!result.success) {
          throw new Error(
            result.error || "Failed to clear service worker cache"
          );
        }
      }

      localStorage.clear();
      sessionStorage.clear();

      if ("indexedDB" in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            })
          );
        } catch (err) {
          console.warn("Failed to clear IndexedDB:", err);
        }
      }

      setIsCleared(true);
      setCacheInfo({});

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsClearing(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const goHome = () => {
    window.location.href = "/";
  };

  const totalCachedItems = Object.values(cacheInfo).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    isClearing,
    isCleared,
    error,
    cacheInfo,
    isLoadingInfo,
    totalCachedItems,
    clearAllData,
    refreshPage,
    goHome,
  };
}
