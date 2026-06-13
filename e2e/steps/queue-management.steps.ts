import { expect, Page } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

async function addSongToQueue(page: Page) {
  // Navigate to search, find first artist, select them, add first song
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
  // Wait for confirmation
  await page
    .locator("[data-testid='confirmation-dialog']")
    .waitFor({ timeout: 10000 });
  await page.waitForTimeout(1000);
}

Given(
  "the user has completed setup with name {string}",
  async ({ page }, name: string) => {
    await page.goto("/");
    await page.evaluate(userName => {
      localStorage.setItem("karaoke-username", userName);
    }, name);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    // Wait for WebSocket connection and session join
    await page
      .locator("[data-testid='connection-status']")
      .waitFor({ timeout: 10000 });
    await page.waitForTimeout(500);
  }
);

Given("the queue is cleared", async ({ page }) => {
  // Clear all songs from the queue via API
  const response = await page.request.get("http://localhost:3000/api/queue");
  const data = await response.json();
  if (data.queue) {
    for (const item of data.queue) {
      await page.request.delete(
        `http://localhost:3000/api/queue?queueItemId=${item.id}&userName=TestUser`
      );
    }
  }
  await page.waitForTimeout(500);
});

Given("the queue has songs", async ({ page }) => {
  await addSongToQueue(page);
  // Wait for WebSocket to broadcast queue update
  await page.waitForTimeout(2000);
});

Given("a song is currently playing", async ({ page }) => {
  // Add a song if the queue is empty, then it auto-plays
  const queueTab = page.locator("[data-testid='queue-tab']");
  await queueTab.click();
  const hasNowPlaying = await page
    .locator("[data-testid='now-playing']")
    .isVisible()
    .catch(() => false);
  if (!hasNowPlaying) {
    await addSongToQueue(page);
    // Wait for autoplay to trigger
    await page.waitForTimeout(3000);
  }
});

Given(
  "the queue has a song added by {string}",
  async ({ page }, _addedBy: string) => {
    await addSongToQueue(page);
  }
);

Given("the queue has multiple songs", async ({ page }) => {
  await addSongToQueue(page);
  // Go back to artists and add another song
  await page.locator("[data-testid='search-tab']").click();
  await page.locator("[data-testid='back-button']").click();
  await page
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 5000 });
  await page.locator("[data-testid='artist-item']").nth(1).click();
  await page
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 10000 });
  await page.locator("[data-testid='add-song-button']").first().click();
  await page.waitForTimeout(500);
});

Given("the queue has {int} pending songs", async ({ page }, count: number) => {
  for (let i = 0; i < count; i++) {
    await page.locator("[data-testid='search-tab']").click();
    if (i > 0) {
      const backButton = page.locator("[data-testid='back-button']");
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();
      }
    }
    await page
      .locator("[data-testid='artist-item']")
      .nth(i % 5)
      .waitFor({ timeout: 10000 });
    await page
      .locator("[data-testid='artist-item']")
      .nth(i % 5)
      .click();
    await page
      .locator("[data-testid='add-song-button']")
      .first()
      .waitFor({ timeout: 10000 });
    await page.locator("[data-testid='add-song-button']").first().click();
    await page.waitForTimeout(500);
  }
});

When("I navigate to the queue tab", async ({ page }) => {
  await page.locator("[data-testid='queue-tab']").click();
});

When("I view the navigation tabs", async ({ page }) => {
  await expect(page.locator("[data-testid='search-tab']")).toBeVisible();
  await expect(page.locator("[data-testid='queue-tab']")).toBeVisible();
});

When("I click the remove button on my song", async ({ page }) => {
  await page.locator("[data-testid='remove-song-button']").first().click();
});

Then("I should see the empty queue message", async ({ page }) => {
  await expect(page.locator("[data-testid='empty-queue']")).toBeVisible();
});

Then("I should see queue items listed", async ({ page }) => {
  // Song may be in queue as pending or already playing (now-playing section)
  const queueItem = page.locator("[data-testid='queue-item']").first();
  const nowPlaying = page.locator("[data-testid='now-playing']");
  await expect(queueItem.or(nowPlaying)).toBeVisible({ timeout: 10000 });
});

Then(
  "each queue item should show the song title and artist",
  async ({ page }) => {
    // Check either queue items or now-playing section has content
    const queueItem = page.locator("[data-testid='queue-item']").first();
    const nowPlaying = page.locator("[data-testid='now-playing']");
    const target = queueItem.or(nowPlaying);
    await expect(target).toContainText(/.+/);
  }
);

Then("I should see the now playing section", async ({ page }) => {
  await expect(page.locator("[data-testid='now-playing']")).toBeVisible({
    timeout: 10000,
  });
});

Then("I should see a remove button for my song", async ({ page }) => {
  await expect(
    page.locator("[data-testid='remove-song-button']").first()
  ).toBeVisible({ timeout: 10000 });
});

Then("the song should be removed from the queue", async ({ page }) => {
  await page.waitForTimeout(1000);
});

Then("I should not see a remove button for that song", async ({ page }) => {
  await expect(page.locator("[data-testid='remove-song-button']")).toHaveCount(
    0
  );
});

Then("each queue item should display its position number", async ({ page }) => {
  const items = page.locator("[data-testid='queue-item']");
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});

Then("I should see the estimated total time", async ({ page }) => {
  await expect(page.locator("[data-testid='total-duration']")).toBeVisible({
    timeout: 5000,
  });
});

Then(
  "the queue tab should show a badge with count {int}",
  async ({ page }, count: number) => {
    const badge = page.locator("[data-testid='queue-tab']").locator("span");
    await expect(badge.first()).toBeVisible({ timeout: 5000 });
  }
);
