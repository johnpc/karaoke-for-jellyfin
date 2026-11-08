import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isAutoplayBlockedError,
  handlePlayFailure,
} from "@/hooks/audioPlaybackPolicy";

const notAllowedError = () =>
  new DOMException(
    "The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.",
    "NotAllowedError"
  );

describe("audioPlaybackPolicy", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isAutoplayBlockedError", () => {
    it("recognises a NotAllowedError DOMException (iOS Safari autoplay policy)", () => {
      expect(isAutoplayBlockedError(notAllowedError())).toBe(true);
    });

    it("recognises any error-like object named NotAllowedError", () => {
      expect(isAutoplayBlockedError({ name: "NotAllowedError" })).toBe(true);
    });

    it("rejects other errors and non-errors", () => {
      expect(isAutoplayBlockedError(new Error("decode failed"))).toBe(false);
      expect(
        isAutoplayBlockedError(new DOMException("x", "NotSupportedError"))
      ).toBe(false);
      expect(isAutoplayBlockedError(null)).toBe(false);
      expect(isAutoplayBlockedError(undefined)).toBe(false);
      expect(isAutoplayBlockedError("NotAllowedError")).toBe(false);
    });
  });

  describe("handlePlayFailure", () => {
    it("turns an autoplay-policy rejection into the needs-gesture state, not an error", () => {
      const handlers = { setError: vi.fn(), onAutoplayBlocked: vi.fn() };

      handlePlayFailure(notAllowedError(), "Play failed", handlers);

      expect(handlers.onAutoplayBlocked).toHaveBeenCalledTimes(1);
      expect(handlers.setError).not.toHaveBeenCalled();
    });

    it("reports other Error rejections with their message", () => {
      const handlers = { setError: vi.fn(), onAutoplayBlocked: vi.fn() };

      handlePlayFailure(new Error("boom"), "Auto-play failed", handlers);

      expect(handlers.setError).toHaveBeenCalledWith("Auto-play failed: boom");
      expect(handlers.onAutoplayBlocked).not.toHaveBeenCalled();
    });

    it("stringifies non-Error rejections", () => {
      const handlers = { setError: vi.fn(), onAutoplayBlocked: vi.fn() };

      handlePlayFailure("weird", "Play failed", handlers);

      expect(handlers.setError).toHaveBeenCalledWith("Play failed: weird");
    });
  });
});
