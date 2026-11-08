// Browser autoplay-policy handling for the TV display's <audio> element.

export interface PlayFailureHandlers {
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  /** The browser refused to start audio without a user gesture. */
  onAutoplayBlocked: () => void;
}

/**
 * True when a rejected play() promise was caused by the browser's autoplay
 * policy (a DOMException named "NotAllowedError"). iOS/iPadOS Safari always
 * rejects programmatic play() of unmuted audio until the element has been
 * started from a user gesture, and offers no setting to change that.
 */
export function isAutoplayBlockedError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "NotAllowedError"
  );
}

/**
 * Route a rejected play() promise. Autoplay-policy rejections are recoverable
 * (the user just needs to tap once), so they become a "needs gesture" state
 * instead of an error message. Anything else is a real playback error.
 */
export function handlePlayFailure(
  err: unknown,
  context: string,
  handlers: PlayFailureHandlers
): void {
  if (isAutoplayBlockedError(err)) {
    console.warn(`${context}: autoplay blocked until the user taps the page`);
    handlers.onAutoplayBlocked();
    return;
  }
  console.error(`${context}:`, err);
  const message = err instanceof Error ? err.message : String(err);
  handlers.setError(`${context}: ${message}`);
}
