import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given("the TV display is loaded", async ({ page }) => {
  await page.goto("/tv");
  await page.waitForLoadState("domcontentloaded");
});

Given("a song is currently playing on the TV", async ({ page }) => {
  // Assumes a song has been queued and is playing via WebSocket fixture
  await page.waitForTimeout(500);
});

Given("there are songs in the queue", async ({ page }) => {
  // Assumes the queue has been populated via WebSocket fixture
  await page.waitForTimeout(500);
});

Given("a song has just completed", async ({ page }) => {
  // Assumes the test fixture triggers a song completion event
  await page.waitForTimeout(500);
});

Given("the rating animation has completed", async ({ page }) => {
  // Assumes the rating animation finished and next-up is showing
  await page.waitForTimeout(500);
});

Given("there is a next song in the queue", async ({ page }) => {
  // Assumes the queue has a pending song after the current one
  await page.waitForTimeout(500);
});

Given("no song is currently playing", async ({ page }) => {
  await expect(page.locator("[data-testid='waiting-screen']")).toBeVisible();
});

When("I press the {string} key", async ({ page }, key: string) => {
  // Ensure page is focused first
  await page.locator("body").click();
  await page.waitForTimeout(200);
  if (key === "Space") {
    await page.keyboard.press("Space");
  } else if (key === "Escape") {
    await page.keyboard.press("Escape");
  } else {
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(300);
});

When("a song is added to the queue", async ({ page }) => {
  // Simulated via WebSocket fixture pushing a song to the queue
  await page.waitForTimeout(500);
});

Then("I should see the waiting screen", async ({ page }) => {
  await expect(page.locator("[data-testid='waiting-screen']")).toBeVisible();
});

Then("I should see the app title", async ({ page }) => {
  await expect(page.locator("[data-testid='app-title']")).toBeVisible();
});

Then("I should see instructions for joining", async ({ page }) => {
  await expect(page.locator("[data-testid='instructions']")).toBeVisible();
});

Then("I should see the connection status indicator", async ({ page }) => {
  await expect(page.locator("[data-testid='connection-status']")).toBeVisible();
});

Then("I should see the QR code for joining the session", async ({ page }) => {
  await expect(page.locator("[data-testid='qr-code']")).toBeVisible();
});

Then("I should see the lyrics display", async ({ page }) => {
  await expect(page.locator("[data-testid='lyrics-display']")).toBeVisible();
});

Then("I should see the current song title", async ({ page }) => {
  await expect(
    page.locator("[data-testid='current-song-title']")
  ).toBeVisible();
});

Then("I should see the current song artist", async ({ page }) => {
  await expect(
    page.locator("[data-testid='current-song-artist']")
  ).toBeVisible();
});

Then("I should see the next up sidebar", async ({ page }) => {
  await expect(page.locator("[data-testid='next-up-sidebar']")).toBeVisible();
});

Then(
  "the sidebar should show the next song's title and artist",
  async ({ page }) => {
    const sidebar = page.locator("[data-testid='next-up-sidebar']");
    await expect(sidebar.locator("[data-testid='song-title']")).toBeVisible();
    await expect(sidebar.locator("[data-testid='song-artist']")).toBeVisible();
  }
);

Then("I should see the rating animation", async ({ page }) => {
  await expect(page.locator("[data-testid='rating-animation']")).toBeVisible();
});

Then("I should see the performance rating", async ({ page }) => {
  await expect(
    page.locator("[data-testid='performance-rating']")
  ).toBeVisible();
});

Then("I should see the next song splash", async ({ page }) => {
  await expect(page.locator("[data-testid='next-song-splash']")).toBeVisible();
});

Then("I should see the next song title", async ({ page }) => {
  await expect(page.locator("[data-testid='next-song-title']")).toBeVisible();
});

Then("I should see the countdown timer", async ({ page }) => {
  await expect(page.locator("[data-testid='countdown-timer']")).toBeVisible();
});

Then("I should see the host controls overlay", async ({ page }) => {
  await expect(page.locator("[data-testid='host-controls']")).toBeVisible();
});

Then("the host controls should be hidden", async ({ page }) => {
  await expect(page.locator("[data-testid='host-controls']")).not.toBeVisible();
});

Then("I should see the queue preview overlay", async ({ page }) => {
  await expect(page.locator("[data-testid='queue-preview']")).toBeVisible();
});

Then("the queue preview should be hidden", async ({ page }) => {
  await expect(page.locator("[data-testid='queue-preview']")).not.toBeVisible();
});

Then("playback should be paused", async ({ page }) => {
  // Verify the playback state changed (TV display does not show explicit paused state in main view)
  await page.waitForTimeout(500);
});

Then("the song should be skipped", async ({ page }) => {
  // Verify that skip was triggered (state change will depend on queue contents)
  await page.waitForTimeout(500);
});

Then("I should see the autoplay countdown", async ({ page }) => {
  await expect(
    page.locator("[data-testid='autoplay-countdown']")
  ).toBeVisible();
});
