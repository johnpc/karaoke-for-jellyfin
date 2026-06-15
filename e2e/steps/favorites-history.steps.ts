import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given(
  "the user has completed setup with name {string}",
  async ({ page }, name: string) => {
    await page.goto("/");
    await page.evaluate(userName => {
      localStorage.setItem("karaoke-username", userName);
      localStorage.removeItem(`karaoke-song-history-${userName}`);
    }, name);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("[data-testid='connection-status']")
      .waitFor({ timeout: 10000 });
    await page.waitForTimeout(500);
  }
);

When("I add a song to the queue", async ({ page }) => {
  await page.locator("[data-testid='search-tab']").click();
  await page.waitForTimeout(500);

  await page
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 60000 });

  await page.locator("[data-testid='artist-item']").first().click();

  await page
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 30000 });

  await page.locator("[data-testid='add-song-button']").first().click();

  const dialog = page.locator("[data-testid='confirmation-dialog']");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("button[aria-label='Close']").click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
});

When("I navigate to the My Songs tab", async ({ page }) => {
  await page.locator("[data-testid='my-songs-tab']").click();
  await page.waitForTimeout(500);
});

When("I tap the favorite button on the song", async ({ page }) => {
  const historyItem = page.locator("[data-testid='song-history-item']").first();
  await historyItem.waitFor({ timeout: 10000 });
  const favBtn = page.locator("[data-testid^='favorite-btn-']").first();
  await favBtn.click();
});

Then("I should see the song in my history", async ({ page }) => {
  const historySection = page.locator("[data-testid='history-section']");
  await expect(historySection).toBeVisible({ timeout: 5000 });

  const historyItem = page.locator("[data-testid='song-history-item']").first();
  await expect(historyItem).toBeVisible({ timeout: 5000 });
});

Then("the song appears in the Favorites section", async ({ page }) => {
  const favSection = page.locator("[data-testid='favorites-section']");
  await expect(favSection).toBeVisible({ timeout: 5000 });

  const favItem = favSection.locator("[data-testid='song-history-item']");
  await expect(favItem.first()).toBeVisible({ timeout: 5000 });
});
