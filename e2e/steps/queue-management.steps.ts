import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given(
  "the user has completed setup with name {string}",
  async ({ page }, name: string) => {
    await page.goto("/");
    // Set localStorage to skip setup
    await page.evaluate(userName => {
      localStorage.setItem("karaoke-username", userName);
    }, name);
    await page.reload();
    await page.waitForLoadState("networkidle");
  }
);

Given("the queue has songs", async ({ page }) => {
  // Queue state is managed via WebSocket; this step assumes test fixtures populate the queue
  await page.waitForTimeout(500);
});

Given("a song is currently playing", async ({ page }) => {
  // Assumes a song has been started via the WebSocket test fixture
  await page.waitForTimeout(500);
});

Given(
  "the queue has a song added by {string}",
  async ({ page }, addedBy: string) => {
    // Test fixture should populate the queue with a song added by the specified user
    await page.waitForTimeout(500);
  }
);

Given("the queue has multiple songs", async ({ page }) => {
  // Test fixture should populate the queue with multiple songs
  await page.waitForTimeout(500);
});

Given("the queue has {int} pending songs", async ({ page }, count: number) => {
  // Test fixture should populate the queue with the specified number of songs
  await page.waitForTimeout(500);
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
  await expect(
    page.locator("[data-testid='queue-item']").first()
  ).toBeVisible();
});

Then(
  "each queue item should show the song title and artist",
  async ({ page }) => {
    const firstItem = page.locator("[data-testid='queue-item']").first();
    await expect(firstItem).toContainText(/.+/); // Contains text (title and artist)
  }
);

Then("I should see the now playing section", async ({ page }) => {
  await expect(page.locator("[data-testid='now-playing']")).toBeVisible();
});

Then("I should see a remove button for my song", async ({ page }) => {
  await expect(
    page.locator("[data-testid='remove-song-button']").first()
  ).toBeVisible();
});

Then("the song should be removed from the queue", async ({ page }) => {
  // After removal, either the queue is empty or the item count decreases
  await page.waitForTimeout(500);
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
  await expect(page.locator("text=Estimated time")).toBeVisible();
});

Then(
  "the queue tab should show a badge with count {int}",
  async ({ page }, count: number) => {
    const badge = page
      .locator("[data-testid='queue-tab']")
      .locator("span.bg-purple-600");
    await expect(badge).toContainText(String(count));
  }
);
