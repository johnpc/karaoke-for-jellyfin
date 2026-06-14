/**
 * Sends a CLEAR_CACHE message to the active service worker controller
 * and returns whether the cache was successfully cleared.
 */
export async function clearServiceWorkerCache(): Promise<boolean> {
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
}

/**
 * Sends a GET_CACHE_INFO message to the active service worker controller
 * and returns a map of cache names to entry counts.
 */
export async function getServiceWorkerCacheInfo(): Promise<
  Record<string, number>
> {
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

    navigator.serviceWorker.controller.postMessage({ type: "GET_CACHE_INFO" }, [
      messageChannel.port2,
    ]);

    return await infoPromise;
  } catch (error) {
    console.error("Failed to get cache info:", error);
    return {};
  }
}
