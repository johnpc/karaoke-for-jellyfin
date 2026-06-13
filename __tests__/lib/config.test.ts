import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getServerConfig } from "@/lib/config";

describe("getServerConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return default values when no env vars set", () => {
    delete process.env.AUTOPLAY_DELAY;
    delete process.env.QUEUE_AUTOPLAY_DELAY;
    delete process.env.CONTROLS_AUTO_HIDE_DELAY;
    delete process.env.TIME_UPDATE_INTERVAL;
    delete process.env.RATING_ANIMATION_DURATION;
    delete process.env.NEXT_SONG_DURATION;

    const config = getServerConfig();
    expect(config.autoplayDelay).toBe(500);
    expect(config.queueAutoplayDelay).toBe(1000);
    expect(config.controlsAutoHideDelay).toBe(10000);
    expect(config.timeUpdateInterval).toBe(2000);
    expect(config.ratingAnimationDuration).toBe(15000);
    expect(config.nextSongDuration).toBe(15000);
  });

  it("should respect AUTOPLAY_DELAY env var", () => {
    process.env.AUTOPLAY_DELAY = "1000";
    const config = getServerConfig();
    expect(config.autoplayDelay).toBe(1000);
  });

  it("should respect QUEUE_AUTOPLAY_DELAY env var", () => {
    process.env.QUEUE_AUTOPLAY_DELAY = "2000";
    const config = getServerConfig();
    expect(config.queueAutoplayDelay).toBe(2000);
  });

  it("should respect CONTROLS_AUTO_HIDE_DELAY env var", () => {
    process.env.CONTROLS_AUTO_HIDE_DELAY = "5000";
    const config = getServerConfig();
    expect(config.controlsAutoHideDelay).toBe(5000);
  });

  it("should respect TIME_UPDATE_INTERVAL env var", () => {
    process.env.TIME_UPDATE_INTERVAL = "500";
    const config = getServerConfig();
    expect(config.timeUpdateInterval).toBe(500);
  });

  it("should respect RATING_ANIMATION_DURATION env var", () => {
    process.env.RATING_ANIMATION_DURATION = "20000";
    const config = getServerConfig();
    expect(config.ratingAnimationDuration).toBe(20000);
  });

  it("should respect NEXT_SONG_DURATION env var", () => {
    process.env.NEXT_SONG_DURATION = "10000";
    const config = getServerConfig();
    expect(config.nextSongDuration).toBe(10000);
  });

  it("should handle all env vars set simultaneously", () => {
    process.env.AUTOPLAY_DELAY = "100";
    process.env.QUEUE_AUTOPLAY_DELAY = "200";
    process.env.CONTROLS_AUTO_HIDE_DELAY = "300";
    process.env.TIME_UPDATE_INTERVAL = "400";
    process.env.RATING_ANIMATION_DURATION = "500";
    process.env.NEXT_SONG_DURATION = "600";

    const config = getServerConfig();
    expect(config.autoplayDelay).toBe(100);
    expect(config.queueAutoplayDelay).toBe(200);
    expect(config.controlsAutoHideDelay).toBe(300);
    expect(config.timeUpdateInterval).toBe(400);
    expect(config.ratingAnimationDuration).toBe(500);
    expect(config.nextSongDuration).toBe(600);
  });

  it("should return NaN for non-numeric env values (parseInt behavior)", () => {
    process.env.AUTOPLAY_DELAY = "not_a_number";
    const config = getServerConfig();
    expect(config.autoplayDelay).toBeNaN();
  });

  it("should parse integer portion of float strings", () => {
    process.env.AUTOPLAY_DELAY = "1500.75";
    const config = getServerConfig();
    expect(config.autoplayDelay).toBe(1500);
  });

  it("should return the AppConfig interface shape", () => {
    const config = getServerConfig();
    expect(config).toHaveProperty("autoplayDelay");
    expect(config).toHaveProperty("queueAutoplayDelay");
    expect(config).toHaveProperty("controlsAutoHideDelay");
    expect(config).toHaveProperty("timeUpdateInterval");
    expect(config).toHaveProperty("ratingAnimationDuration");
    expect(config).toHaveProperty("nextSongDuration");
    expect(Object.keys(config)).toHaveLength(6);
  });
});
