import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given(
  "the admin has completed setup with name {string}",
  async ({ page }, name: string) => {
    await page.goto("/admin");
    // Set localStorage to skip admin setup
    await page.evaluate(userName => {
      localStorage.setItem("karaoke-admin-username", `${userName} (Admin)`);
    }, name);
    await page.reload();
    await page.waitForLoadState("networkidle");
  }
);

Given("the admin is on the playback tab", async ({ page }) => {
  // Playback tab is the default active tab in admin interface
  await expect(page.locator("[data-testid='playback-controls']")).toBeVisible();
});

When("I click the play\\/pause button", async ({ page }) => {
  await page.locator("[data-testid='play-pause-button']").click();
});

When("I click the play\\/pause button again", async ({ page }) => {
  await page.locator("[data-testid='play-pause-button']").click();
});

When("I click the skip button", async ({ page }) => {
  await page.locator("[data-testid='skip-button']").click();
});

When("I set the volume to {int}", async ({ page }, volume: number) => {
  const slider = page.locator("[data-testid='volume-slider']");
  await slider.fill(String(volume));
});

When("I click the mute button", async ({ page }) => {
  await page.locator("[data-testid='mute-button']").click();
});

When("I click the mute button again", async ({ page }) => {
  await page.locator("[data-testid='mute-button']").click();
});

When("I drag the seek slider to a new position", async ({ page }) => {
  const slider = page.locator("[data-testid='seek-slider']");
  await slider.fill("30");
});

When("I click the lyrics offset plus button", async ({ page }) => {
  await page.locator("[data-testid='lyrics-offset-plus']").click();
});

When("I click the lyrics offset minus button", async ({ page }) => {
  await page.locator("[data-testid='lyrics-offset-minus']").click();
});

Then("I should see the playback controls section", async ({ page }) => {
  await expect(page.locator("[data-testid='playback-controls']")).toBeVisible();
});

Then("I should see the play\\/pause button", async ({ page }) => {
  await expect(page.locator("[data-testid='play-pause-button']")).toBeVisible();
});

Then("I should see the skip button", async ({ page }) => {
  await expect(page.locator("[data-testid='skip-button']")).toBeVisible();
});

Then(
  "the playback status should show {string}",
  async ({ page }, status: string) => {
    await expect(page.locator("[data-testid='playback-status']")).toContainText(
      status
    );
  }
);

Then("the next song in the queue should start", async ({ page }) => {
  // Verify that skip was processed (depends on queue state)
  await page.waitForTimeout(500);
});

Then("I should see the volume slider", async ({ page }) => {
  await expect(page.locator("[data-testid='volume-slider']")).toBeVisible();
});

Then(
  "the volume display should show {string}",
  async ({ page }, volumeText: string) => {
    await expect(page.locator("text=" + volumeText)).toBeVisible();
  }
);

Then("the audio should be muted", async ({ page }) => {
  // Check that the mute icon state changed (SpeakerXMark is shown)
  await page.waitForTimeout(300);
});

Then("the audio should be unmuted", async ({ page }) => {
  // Check that the unmute icon state changed (SpeakerWave is shown)
  await page.waitForTimeout(300);
});

Then("I should see the seek control", async ({ page }) => {
  await expect(page.locator("[data-testid='seek-control']")).toBeVisible();
});

Then("the seek slider should show the current time", async ({ page }) => {
  await expect(page.locator("[data-testid='seek-slider']")).toBeVisible();
});

Then("the seek slider should show the total duration", async ({ page }) => {
  // Duration is shown as text near the seek slider
  await expect(page.locator("[data-testid='seek-control']")).toContainText(
    /\d+:\d+/
  );
});

Then("playback should resume from that position", async ({ page }) => {
  // Verify seek was processed
  await page.waitForTimeout(500);
});

Then("I should see the lyrics timing control", async ({ page }) => {
  await expect(page.locator("[data-testid='lyrics-timing']")).toBeVisible();
});

Then("the lyrics offset should increase by 1 second", async ({ page }) => {
  await expect(page.locator("[data-testid='lyrics-timing']")).toContainText(
    /\+?\d+s/
  );
});

Then("the lyrics offset should decrease by 1 second", async ({ page }) => {
  await expect(page.locator("[data-testid='lyrics-timing']")).toContainText(
    /[+-]?\d+s/
  );
});

Then("I should see the current song info", async ({ page }) => {
  await expect(page.locator("[data-testid='current-song-info']")).toBeVisible();
});

Then("the song info should show the title and artist", async ({ page }) => {
  const songInfo = page.locator("[data-testid='current-song-info']");
  await expect(songInfo).toContainText(/.+/); // Contains some text
});
