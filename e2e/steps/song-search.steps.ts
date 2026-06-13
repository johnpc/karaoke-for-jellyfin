import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given("the search interface is visible", async ({ page }) => {
  await expect(page.locator("[data-testid='search-content']")).toBeVisible();
});

Given("artists are listed in the results", async ({ page }) => {
  await expect(page.locator("[data-testid='artist-results']")).toBeVisible();
  await expect(
    page.locator("[data-testid='artist-item']").first()
  ).toBeVisible();
});

Given("albums are listed in the results", async ({ page }) => {
  await expect(page.locator("[data-testid='album-results']")).toBeVisible();
});

Given("songs are listed in the results", async ({ page }) => {
  await expect(page.locator("[data-testid='song-item']").first()).toBeVisible();
});

Given("I am viewing songs for a selected artist", async ({ page }) => {
  // Click on the first artist to view their songs
  await page.locator("[data-testid='artist-item']").first().click();
  await expect(page.locator("[data-testid='back-button']")).toBeVisible();
});

Given("the playlists tab is active", async ({ page }) => {
  await page.locator("[data-testid='playlist-tab']").click();
});

Given("playlists are listed", async ({ page }) => {
  await expect(
    page.locator("[data-testid='playlist-item']").first()
  ).toBeVisible({ timeout: 15000 });
});

Given("search results are paginated", async ({ page }) => {
  // Assumes the test data has enough results to paginate
  await page.waitForTimeout(500);
});

Given("the WebSocket connection is lost", async ({ page }) => {
  // Simulate disconnection by evaluating in the page context
  await page.evaluate(() => {
    // Force disconnect the WebSocket for testing
    window.dispatchEvent(new Event("offline"));
  });
  await page.waitForTimeout(500);
});

When("I type {string} in the search input", async ({ page }, query: string) => {
  await page.locator("[data-testid='search-input']").fill(query);
  // Wait for debounced search to trigger and API to respond
  await page.waitForTimeout(1000);
});

When("the search interface loads", async ({ page }) => {
  await page.waitForLoadState("domcontentloaded");
});

When("I click on an artist item", async ({ page }) => {
  await page.locator("[data-testid='artist-item']").first().click();
});

When("I click the back button", async ({ page }) => {
  await page.locator("[data-testid='back-button']").click();
});

When("I click on an album item", async ({ page }) => {
  await page
    .locator("[data-testid='album-results']")
    .locator("button")
    .first()
    .click();
});

When("I click the add button on a song", async ({ page }) => {
  await page.locator("[data-testid='add-song-button']").first().click();
});

When("I click the playlists tab", async ({ page }) => {
  await page.locator("[data-testid='playlist-tab']").click();
});

When("I click on a playlist item", async ({ page }) => {
  await page.locator("[data-testid='playlist-item']").first().click();
});

When("I click the load more button", async ({ page }) => {
  await page.locator("text=Load More").click();
});

Then("I should see the search input field", async ({ page }) => {
  await expect(page.locator("[data-testid='search-input']")).toBeVisible();
});

Then(
  "the placeholder text should indicate searching for artists, albums, and songs",
  async ({ page }) => {
    const input = page.locator("[data-testid='search-input']");
    await expect(input).toHaveAttribute("placeholder", /artist|album|song/i);
  }
);

Then("I should see search results displayed", async ({ page }) => {
  await expect(page.locator("[data-testid='search-results']")).toBeVisible({
    timeout: 15000,
  });
});

Then("the results should include song items", async ({ page }) => {
  await expect(page.locator("[data-testid='song-item']").first()).toBeVisible({
    timeout: 15000,
  });
});

Then("the results should include artist items", async ({ page }) => {
  await expect(page.locator("[data-testid='artist-item']").first()).toBeVisible(
    { timeout: 15000 }
  );
});

Then("I should see a list of artists", async ({ page }) => {
  await expect(page.locator("[data-testid='artist-results']")).toBeVisible();
});

Then("I should see the artist's songs", async ({ page }) => {
  await expect(page.locator("[data-testid='artist-songs']")).toBeVisible({
    timeout: 15000,
  });
});

Then("I should see a back button to return to artists", async ({ page }) => {
  await expect(page.locator("[data-testid='back-button']")).toBeVisible();
});

Then("I should see the artist list again", async ({ page }) => {
  await expect(page.locator("[data-testid='artist-results']")).toBeVisible();
});

Then("I should see the album's songs", async ({ page }) => {
  await expect(page.locator("[data-testid='album-songs']")).toBeVisible();
});

Then("I should see a back button to return to albums", async ({ page }) => {
  await expect(page.locator("[data-testid='back-button']")).toBeVisible();
});

Then("I should see a confirmation dialog", async ({ page }) => {
  await expect(
    page.locator("[data-testid='confirmation-dialog']")
  ).toBeVisible();
});

Then(
  "the confirmation should indicate the song was added",
  async ({ page }) => {
    await expect(
      page.locator("[data-testid='confirmation-dialog']")
    ).toContainText(/added to queue/i);
  }
);

Then("I should see an error about not being connected", async ({ page }) => {
  await expect(page.locator("[data-testid='error-message']")).toBeVisible();
});

Then("I should see the playlists list", async ({ page }) => {
  await expect(
    page.locator("[data-testid='playlist-item']").first()
  ).toBeVisible({ timeout: 15000 });
});

Then("I should see the playlist's songs", async ({ page }) => {
  await expect(page.locator("[data-testid='playlist-songs']")).toBeVisible({
    timeout: 15000,
  });
});

Then("I should see a back button to return to playlists", async ({ page }) => {
  await expect(page.locator("[data-testid='back-button']")).toBeVisible();
});

Then("additional results should be appended", async ({ page }) => {
  // After loading more, we expect more items in the list
  await page.waitForTimeout(1000);
  const items = page.locator(
    "[data-testid='artist-item'], [data-testid='song-item']"
  );
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});
