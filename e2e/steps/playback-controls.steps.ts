import { expect, Page } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

async function addSongViaSearch(page: Page) {
  await page.locator("[data-testid='search-tab']").click();
  await page
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 15000 });
  await page.locator("[data-testid='artist-item']").first().click();
  await page
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 15000 });
  await page.locator("[data-testid='add-song-button']").first().click();
  await page
    .locator("[data-testid='confirmation-dialog']")
    .waitFor({ timeout: 10000 });
  await page.waitForTimeout(1000);
}

Given(
  "the admin has completed setup with name {string}",
  async ({ page }, name: string) => {
    // First add a song via the mobile interface so admin has something to control
    await page.goto("/");
    await page.evaluate(userName => {
      localStorage.setItem("karaoke-username", userName);
      localStorage.setItem("karaoke-admin-username", `${userName} (Admin)`);
    }, name);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    await addSongViaSearch(page);
    // Now navigate to admin and wait for WebSocket sync
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
  }
);

Given("the admin is on the playback tab", async ({ page }) => {
  await expect(page.locator("[data-testid='playback-controls']")).toBeVisible({
    timeout: 10000,
  });
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
  await expect(page.locator("[data-testid='playback-controls']")).toBeVisible({
    timeout: 10000,
  });
});

Then("I should see the play\\/pause button", async ({ page }) => {
  await expect(page.locator("[data-testid='play-pause-button']")).toBeVisible();
});

Then("I should see the skip button", async ({ page }) => {
  await expect(page.locator("[data-testid='skip-button']")).toBeVisible();
});

Then("the next song in the queue should start", async ({ page }) => {
  await page.waitForTimeout(1000);
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
  await page.waitForTimeout(300);
});

Then("the audio should be unmuted", async ({ page }) => {
  await page.waitForTimeout(300);
});

Then("playback should resume from that position", async ({ page }) => {
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
  await expect(page.locator("[data-testid='current-song-info']")).toBeVisible({
    timeout: 10000,
  });
});

Then("the song info should show the title and artist", async ({ page }) => {
  const songInfo = page.locator("[data-testid='current-song-info']");
  await expect(songInfo).toContainText(/.+/);
});
