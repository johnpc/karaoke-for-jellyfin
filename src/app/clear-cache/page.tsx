"use client";

import { useState, useEffect } from "react";
import {
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface CacheInfo {
  [cacheName: string]: number;
}

export default function ClearCachePage() {
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
      // Clear service worker caches
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

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear IndexedDB (if any)
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

      // Auto-reload after a short delay
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrashIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clear Cache</h1>
          <p className="text-gray-600">
            Clear all cached data to resolve update issues
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">
                Before you continue
              </h3>
              <p className="text-sm text-yellow-700">
                This will clear all cached data including your saved
                preferences. You may need to re-enter your name and settings
                after clearing.
              </p>
            </div>
          </div>
        </div>

        {/* Cache Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600" />
            Cache Information
          </h2>

          {isLoadingInfo ? (
            <div className="flex items-center text-gray-500">
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Loading cache information...
            </div>
          ) : (
            <div className="space-y-3">
              {Object.keys(cacheInfo).length === 0 ? (
                <p className="text-gray-500">No cached data found</p>
              ) : (
                <>
                  {Object.entries(cacheInfo).map(([cacheName, count]) => (
                    <div
                      key={cacheName}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium text-gray-700">
                        {cacheName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {count} items
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-gray-900">Total cached items:</span>
                      <span className="text-gray-900">{totalCachedItems}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Success Message */}
        {isCleared && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-green-800">
                  Cache cleared successfully!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Redirecting to home page in a moment...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-red-800">
                  Error clearing cache
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={clearAllData}
            disabled={isClearing || isCleared}
            className="w-full flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isClearing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Clearing cache...
              </>
            ) : (
              <>
                <TrashIcon className="w-5 h-5 mr-2" />
                Clear All Cache & Data
              </>
            )}
          </button>

          <div className="flex space-x-3">
            <button
              onClick={refreshPage}
              disabled={isClearing}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh Page
            </button>

            <button
              onClick={goHome}
              disabled={isClearing}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-50 text-purple-700 font-medium rounded-lg transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">
            When to use this page:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>&bull; App is not showing the latest updates</li>
            <li>&bull; Features are not working as expected</li>
            <li>&bull; You&apos;re seeing old or cached content</li>
            <li>
              &bull; App appears to be &ldquo;stuck&rdquo; on an old version
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
