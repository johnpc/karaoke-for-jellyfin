import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const singleUserTestDir = defineBddConfig({
  outputDir: ".features-gen/single-user",
  features: [
    "e2e/features/admin-controls.feature",
    "e2e/features/playback-controls.feature",
    "e2e/features/playlist-browse.feature",
    "e2e/features/queue-management.feature",
    "e2e/features/session-management.feature",
    "e2e/features/song-search.feature",
    "e2e/features/tv-display.feature",
  ],
  steps: [
    "e2e/steps/fixtures.ts",
    "e2e/steps/admin-controls.steps.ts",
    "e2e/steps/playback-controls.steps.ts",
    "e2e/steps/queue-management.steps.ts",
    "e2e/steps/session-management.steps.ts",
    "e2e/steps/song-search.steps.ts",
    "e2e/steps/tv-display.steps.ts",
  ],
});

const multiUserTestDir = defineBddConfig({
  outputDir: ".features-gen/multi-user",
  features: "e2e/features/multi-user.feature",
  steps: "e2e/steps/multi-user.steps.ts",
});

const adminSyncTestDir = defineBddConfig({
  outputDir: ".features-gen/admin-sync",
  features: "e2e/features/admin-playback-sync.feature",
  steps: "e2e/steps/admin-playback-sync.steps.ts",
});

const fullPlaybackTestDir = defineBddConfig({
  outputDir: ".features-gen/full-playback",
  features: "e2e/features/full-playback.feature",
  steps: "e2e/steps/full-playback.steps.ts",
});

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "single-user",
      testDir: singleUserTestDir,
      use: { ...devices["Desktop Chrome"] },
      timeout: 60000,
    },
    {
      name: "multi-user",
      testDir: multiUserTestDir,
      use: { ...devices["Desktop Chrome"] },
      timeout: 90000,
    },
    {
      name: "admin-sync",
      testDir: adminSyncTestDir,
      use: { ...devices["Desktop Chrome"] },
      timeout: 90000,
    },
    {
      name: "full-playback",
      testDir: fullPlaybackTestDir,
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        launchOptions: {
          args: ["--autoplay-policy=no-user-gesture-required"],
        },
      },
      timeout: 300000,
    },
  ],
  webServer: {
    command: process.env.CI ? "npm start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
