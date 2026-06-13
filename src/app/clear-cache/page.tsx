"use client";

import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useCacheManager } from "@/hooks/useCacheManager";
import { CacheInfoDisplay } from "@/components/cache/CacheInfoDisplay";
import { CacheActions } from "@/components/cache/CacheActions";
import { CacheStatusMessages } from "@/components/cache/CacheStatusMessages";

export default function ClearCachePage() {
  const {
    isClearing,
    isCleared,
    error,
    cacheInfo,
    isLoadingInfo,
    totalCachedItems,
    clearAllData,
    refreshPage,
    goHome,
  } = useCacheManager();

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

        <CacheInfoDisplay
          isLoadingInfo={isLoadingInfo}
          cacheInfo={cacheInfo}
          totalCachedItems={totalCachedItems}
        />

        <CacheStatusMessages isCleared={isCleared} error={error} />

        <CacheActions
          isClearing={isClearing}
          isCleared={isCleared}
          onClear={clearAllData}
          onRefresh={refreshPage}
          onGoHome={goHome}
        />

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
