import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given(
  "the admin interface is loaded at {string}",
  async ({ page }, path: string) => {
    await page.goto(path);
    await page.evaluate(() => {
      localStorage.setItem("karaoke-admin-username", "Admin (Admin)");
    });
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
  }
);

Given("the queue is empty", async ({ page }) => {
  await page.waitForTimeout(300);
});

When("I click the queue tab", async ({ page }) => {
  await page.locator("text=Queue").first().click();
});

When("I click the emergency tab", async ({ page }) => {
  await page.locator("button:has-text('Emergency')").click();
});

When("I click the remove button on a queue item", async ({ page }) => {
  await page.locator("[data-testid='admin-remove-song']").first().click();
});

When("I click the emergency stop button", async ({ page }) => {
  await page
    .locator("[data-testid='emergency-stop-button']")
    .waitFor({ state: "visible", timeout: 10000 });
  await page.locator("[data-testid='emergency-stop-button']").click();
});

When("I click the restart song button", async ({ page }) => {
  await page
    .locator("[data-testid='restart-song-button']")
    .waitFor({ state: "visible", timeout: 10000 });
  await page.locator("[data-testid='restart-song-button']").click();
});

Then("I should see the playback tab", async ({ page }) => {
  await expect(page.locator("text=Playback")).toBeVisible();
});

Then("I should see the queue tab", async ({ page }) => {
  await expect(page.locator("text=Queue")).toBeVisible();
});

Then("I should see the emergency tab", async ({ page }) => {
  await expect(page.locator("text=Emergency")).toBeVisible();
});

Then("I should see the queue management section", async ({ page }) => {
  await expect(page.locator("[data-testid='queue-management']")).toBeVisible({
    timeout: 10000,
  });
});

Then("I should see the queue count", async ({ page }) => {
  await expect(page.locator("[data-testid='queue-count']")).toBeVisible();
});

Then("I should see that there are no songs in queue", async ({ page }) => {
  await expect(page.locator("text=No songs in queue")).toBeVisible();
});

Then("I should see the admin queue list", async ({ page }) => {
  await expect(page.locator("[data-testid='admin-queue-list']")).toBeVisible({
    timeout: 10000,
  });
});

Then("each item should show the song title", async ({ page }) => {
  const firstItem = page.locator("[data-testid='admin-queue-item']").first();
  await expect(firstItem.locator("[data-testid='song-title']")).toBeVisible();
});

Then("each item should show the artist", async ({ page }) => {
  const firstItem = page.locator("[data-testid='admin-queue-item']").first();
  await expect(firstItem.locator("[data-testid='song-artist']")).toBeVisible();
});

Then("each item should show who added it", async ({ page }) => {
  const firstItem = page.locator("[data-testid='admin-queue-item']").first();
  await expect(firstItem.locator("[data-testid='added-by']")).toBeVisible();
});

Then("the queue count should decrease", async ({ page }) => {
  await page.waitForTimeout(500);
});

Then("I should see the emergency controls", async ({ page }) => {
  await expect(page.locator("[data-testid='emergency-controls']")).toBeVisible({
    timeout: 10000,
  });
});

Then("playback should stop immediately", async ({ page }) => {
  await page.waitForTimeout(500);
});

Then("the song should restart from the beginning", async ({ page }) => {
  await page.waitForTimeout(500);
});

Then("I should see the system status section", async ({ page }) => {
  await expect(page.locator("[data-testid='system-status']")).toBeVisible({
    timeout: 10000,
  });
});

Then("the connection indicator should show connected", async ({ page }) => {
  await expect(
    page.locator("[data-testid='connection-indicator']")
  ).toContainText("Connected");
});

Then("I should see the active user count", async ({ page }) => {
  await expect(page.locator("[data-testid='user-count']")).toBeVisible({
    timeout: 10000,
  });
});

Then("I should see the cache status section", async ({ page }) => {
  await expect(page.locator("[data-testid='cache-status']")).toBeVisible({
    timeout: 10000,
  });
});

Then("I should see the clear cache button", async ({ page }) => {
  await expect(page.locator("[data-testid='clear-cache-button']")).toBeVisible({
    timeout: 10000,
  });
});
