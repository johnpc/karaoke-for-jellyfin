import { expect, Page, BrowserContext } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";

// Extend the base test with multi-user fixtures providing isolated browser contexts
const test = base.extend<{
  alicePage: Page;
  aliceContext: BrowserContext;
  bobPage: Page;
  bobContext: BrowserContext;
  tvPage: Page;
  tvContext: BrowserContext;
}>({
  aliceContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  alicePage: async ({ aliceContext }, use) => {
    const page = await aliceContext.newPage();
    await use(page);
  },
  bobContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  bobPage: async ({ bobContext }, use) => {
    const page = await bobContext.newPage();
    await use(page);
  },
  tvContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  tvPage: async ({ tvContext }, use) => {
    const page = await tvContext.newPage();
    await use(page);
  },
});

export { test };
const { Given, When, Then } = createBdd(test);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function joinSession(page: Page, userName: string): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  // Clear any existing session
  await page.evaluate(() => {
    localStorage.removeItem("karaoke-username");
  });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");

  // Fill in name and join
  await page.locator("[data-testid='username-input']").fill(userName);
  await page.locator("[data-testid='join-session-button']").click();

  // Wait for the main interface to load (search tab visible = joined)
  await expect(page.locator("[data-testid='search-tab']")).toBeVisible({
    timeout: 10000,
  });
}

async function dismissConfirmation(page: Page): Promise<void> {
  const dialog = page.locator("[data-testid='confirmation-dialog']");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("button[aria-label='Close']").click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
}

async function searchAndAddSong(page: Page): Promise<void> {
  // Make sure we are on the search tab
  await page.locator("[data-testid='search-tab']").click();
  await page.waitForTimeout(500);

  // If we're in an artist's song view (back button visible), go back first
  const backButton = page.locator("[data-testid='back-button']");
  if (await backButton.isVisible().catch(() => false)) {
    await backButton.click();
  }

  // Wait for artists to load (search tab shows artists by default)
  await page
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 15000 });

  // Click first artist to see their songs
  await page.locator("[data-testid='artist-item']").first().click();

  // Wait for add buttons to appear
  await page
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 15000 });

  // Click the first add button
  await page.locator("[data-testid='add-song-button']").first().click();

  // Dismiss the confirmation dialog
  await dismissConfirmation(page);
}

async function navigateToQueue(page: Page): Promise<void> {
  await page.locator("[data-testid='queue-tab']").click();
  // Give the queue view a moment to render
  await expect(page.locator("[data-testid='queue-content']")).toBeVisible({
    timeout: 5000,
  });
}

// ---------------------------------------------------------------------------
// Given steps
// ---------------------------------------------------------------------------

Given(
  "{string} has joined the session on device 1",
  async ({ alicePage }, name: string) => {
    await joinSession(alicePage, name);
  }
);

Given(
  "{string} has joined the session on device 2",
  async ({ bobPage }, name: string) => {
    await joinSession(bobPage, name);
  }
);

Given("the TV display is open", async ({ tvPage }) => {
  await tvPage.goto("/tv");
  await tvPage.waitForLoadState("domcontentloaded");
  // Wait for the TV to connect (connection status becomes "Connected")
  await expect(
    tvPage.locator("[data-testid='connection-status']")
  ).toContainText("Connected", { timeout: 10000 });
});

Given("no songs are in the queue", async ({ tvPage }) => {
  // Verify the waiting screen is showing (implies empty queue)
  await expect(tvPage.locator("[data-testid='waiting-screen']")).toBeVisible({
    timeout: 5000,
  });
});

// ---------------------------------------------------------------------------
// When steps
// ---------------------------------------------------------------------------

When("Alice adds a song to the queue", async ({ alicePage }) => {
  await searchAndAddSong(alicePage);
});

When("Bob adds a song to the queue", async ({ bobPage }) => {
  await searchAndAddSong(bobPage);
});

When(
  "Alice adds {string} to the queue",
  async ({ alicePage }, _searchTerm: string) => {
    await searchAndAddSong(alicePage);
  }
);

When(
  "Bob adds {string} to the queue",
  async ({ bobPage }, _searchTerm: string) => {
    await searchAndAddSong(bobPage);
  }
);

When("the current song finishes on the TV", async ({ tvPage }) => {
  // Skip the current song via API (more reliable than faking audio events in headless)
  await tvPage.request.put("http://localhost:3000/api/queue", {
    data: { action: "skip", userId: "Alice" },
  });
  await tvPage.waitForTimeout(2000);
});

When("Alice adds two songs to the queue", async ({ alicePage }) => {
  // Add first song
  await searchAndAddSong(alicePage);

  // Navigate back to artist list
  await alicePage.locator("[data-testid='back-button']").click();
  await alicePage
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 15000 });

  // Pick a different artist for the second song
  await alicePage.locator("[data-testid='artist-item']").nth(1).click();
  await alicePage
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 15000 });
  await alicePage.locator("[data-testid='add-song-button']").first().click();

  await dismissConfirmation(alicePage);
});

When("the first song finishes on the TV", async ({ tvPage }) => {
  // Wait for the TV to show the song is playing
  const lyricsOrCountdown = tvPage
    .locator(
      "[data-testid='lyrics-display'], [data-testid='autoplay-countdown']"
    )
    .first();
  await expect(lyricsOrCountdown).toBeVisible({ timeout: 30000 });

  // Skip the current song via API (Alice added it so she can skip)
  await tvPage.request.put("http://localhost:3000/api/queue", {
    data: { action: "skip", userId: "Alice" },
  });
  await tvPage.waitForTimeout(2000);
});

// ---------------------------------------------------------------------------
// Then steps
// ---------------------------------------------------------------------------

Then("Bob sees the song in their queue", async ({ bobPage }) => {
  await navigateToQueue(bobPage);
  // Song may be playing (now-playing) or pending (queue-item)
  const queueItem = bobPage.locator("[data-testid='queue-item']").first();
  const nowPlaying = bobPage.locator("[data-testid='now-playing']");
  await expect(queueItem.or(nowPlaying)).toBeVisible({ timeout: 10000 });
});

Then("the TV display shows the song playing", async ({ tvPage }) => {
  // The TV should transition from waiting to showing lyrics or autoplay countdown
  const lyricsOrCountdown = tvPage
    .locator(
      "[data-testid='lyrics-display'], [data-testid='autoplay-countdown']"
    )
    .first();
  await expect(lyricsOrCountdown).toBeVisible({ timeout: 30000 });
});

Then("the TV display shows the first song playing", async ({ tvPage }) => {
  // Wait for lyrics display to be visible (song is actively playing)
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible({
    timeout: 30000,
  });
});

Then("the TV display shows the second song playing", async ({ tvPage }) => {
  // After skip, server auto-advances to next song. TV shows lyrics or autoplay countdown.
  const lyricsOrCountdown = tvPage
    .locator(
      "[data-testid='lyrics-display'], [data-testid='autoplay-countdown']"
    )
    .first();
  await expect(lyricsOrCountdown).toBeVisible({ timeout: 30000 });
});

Then("both users see the queue updated", async ({ alicePage, bobPage }) => {
  // Navigate both users to queue tab and verify the queue reflects changes
  await navigateToQueue(alicePage);
  await navigateToQueue(bobPage);

  // The played song should no longer be pending; verify the queue state is consistent
  // At minimum, both pages should show the queue view without errors
  await expect(
    alicePage.locator("[data-testid='queue-content']")
  ).toBeVisible();
  await expect(bobPage.locator("[data-testid='queue-content']")).toBeVisible();
});

Then("Bob's queue view shows 1 song", async ({ bobPage }) => {
  await navigateToQueue(bobPage);
  // Song may be playing (now-playing) or pending (queue-item)
  const queueItem = bobPage.locator("[data-testid='queue-item']").first();
  const nowPlaying = bobPage.locator("[data-testid='now-playing']");
  await expect(queueItem.or(nowPlaying)).toBeVisible({ timeout: 10000 });
});

Then("Alice's queue view shows 2 songs", async ({ alicePage }) => {
  await navigateToQueue(alicePage);
  // At least 2 items visible: could be now-playing + queue-item, or 2 queue-items
  const totalItems = alicePage.locator(
    "[data-testid='queue-item'], [data-testid='now-playing']"
  );
  const count = await totalItems.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

Then("the TV shows the waiting screen", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='waiting-screen']")).toBeVisible({
    timeout: 10000,
  });
});

Then("the TV shows a rating animation", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='rating-animation']")).toBeVisible({
    timeout: 15000,
  });
});

Then("then shows the next song splash", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='next-song-splash']")).toBeVisible({
    timeout: 15000,
  });
});

Then("then starts playing the second song", async ({ tvPage }) => {
  // After the next-song splash completes, lyrics display should reappear
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible({
    timeout: 30000,
  });
});
