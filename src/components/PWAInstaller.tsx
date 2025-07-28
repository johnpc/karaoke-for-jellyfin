"use client";

import { useEffect, useState } from "react";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    // Register service worker with update handling
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("SW registered: ", registration);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker is available
                  setWaitingWorker(newWorker);
                  setShowUpdatePrompt(true);
                }
              });
            }
          });

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            // Service worker has been updated and is now controlling the page
            window.location.reload();
          });

          // Check for waiting service worker
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdatePrompt(true);
          }

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        } catch (registrationError) {
          console.log("SW registration failed: ", registrationError);
        }
      });
    }

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show install prompt if not showing update prompt
      if (!showUpdatePrompt) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [showUpdatePrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdateClick = async () => {
    if (!waitingWorker) return;

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    setShowUpdatePrompt(false);
    setWaitingWorker(null);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Update prompt (higher priority)
  if (showUpdatePrompt && waitingWorker) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                {isUpdating ? (
                  <ArrowPathIcon className="w-6 h-6 text-blue-600 animate-spin" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {isUpdating ? "Updating..." : "Update Available"}
                </h3>
                <p className="text-sm text-blue-700">
                  {isUpdating
                    ? "Please wait while the app updates"
                    : "A new version of the app is ready"}
                </p>
              </div>
            </div>
            {!isUpdating && (
              <button
                onClick={handleDismissUpdate}
                className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-blue-400" />
              </button>
            )}
          </div>

          {!isUpdating && (
            <div className="flex space-x-2">
              <button
                onClick={handleUpdateClick}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={handleDismissUpdate}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Install prompt (lower priority)
  if (!isInstalled && showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
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
              onClick={handleDismissInstall}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismissInstall}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
