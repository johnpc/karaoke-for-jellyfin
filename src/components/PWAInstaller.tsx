"use client";

import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { usePWAInstall } from "@/hooks/usePWAInstall";

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      {children}
    </div>
  );
}

export function PWAInstaller() {
  const pwa = usePWAInstall();

  if (pwa.showUpdatePrompt && pwa.hasWaitingWorker) {
    return (
      <Banner>
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                {pwa.isUpdating ? (
                  <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {pwa.isUpdating ? "Updating..." : "Update Available"}
                </h3>
                <p className="text-sm text-blue-700">
                  {pwa.isUpdating
                    ? "Please wait while the app updates"
                    : "A new version of the app is ready"}
                </p>
              </div>
            </div>
            {!pwa.isUpdating && (
              <button
                onClick={pwa.handleDismissUpdate}
                className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-blue-400" />
              </button>
            )}
          </div>
          {!pwa.isUpdating && (
            <div className="flex space-x-2">
              <button
                onClick={pwa.handleUpdateClick}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={pwa.handleDismissUpdate}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </Banner>
    );
  }

  if (!pwa.isInstalled && pwa.showInstallPrompt) {
    return (
      <Banner>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <ArrowDownTrayIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Install Karaoke App
                </h3>
                <p className="text-sm text-gray-600">
                  Add to your home screen for quick access
                </p>
              </div>
            </div>
            <button
              onClick={pwa.handleDismissInstall}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={pwa.handleInstallClick}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Install
            </button>
            <button
              onClick={pwa.handleDismissInstall}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </Banner>
    );
  }

  return null;
}
