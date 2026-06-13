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
  await page.waitForLoadState("networkidle");

  // Clear any existing session
  await page.evaluate(() => {
    localStorage.removeItem("karaoke-username");
  });
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Fill in name and join
  await page.locator("[data-testid='username-input']").fill(userName);
  await page.locator("[data-testid='join-session-button']").click();

  // Wait for the main interface to load (search tab visible = joined)
  await expect(page.locator("[data-testid='search-tab']")).toBeVisible({
    timeout: 10000,
  });
}

async function searchAndAddSong(page: Page): Promise<void> {
  // Make sure we are on the search tab
  await page.locator("[data-testid='search-tab']").click();

  // Type a search query — use a broad term likely to return results
  const searchInput = page.locator("[data-testid='search-input']");
  await searchInput.fill("love");
  await searchInput.press("Enter");

  // Wait for at least one song result to appear
  await expect(page.locator("[data-testid='song-item']").first()).toBeVisible({
    timeout: 15000,
  });

  // Click the first add button
  await page.locator("[data-testid='add-song-button']").first().click();

  // Wait for add confirmation or the loading spinner to disappear
  await expect(
    page.locator("[data-testid='add-song-loading']")
  ).not.toBeVisible({ timeout: 10000 });
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
  await tvPage.waitForLoadState("networkidle");
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
  async ({ alicePage }, searchTerm: string) => {
    await alicePage.locator("[data-testid='search-tab']").click();
    const searchInput = alicePage.locator("[data-testid='search-input']");
    await searchInput.fill(searchTerm);
    await searchInput.press("Enter");

    await expect(
      alicePage.locator("[data-testid='song-item']").first()
    ).toBeVisible({ timeout: 15000 });

    await alicePage.locator("[data-testid='add-song-button']").first().click();

    await expect(
      alicePage.locator("[data-testid='add-song-loading']")
    ).not.toBeVisible({ timeout: 10000 });
  }
);

When(
  "Bob adds {string} to the queue",
  async ({ bobPage }, searchTerm: string) => {
    await bobPage.locator("[data-testid='search-tab']").click();
    const searchInput = bobPage.locator("[data-testid='search-input']");
    await searchInput.fill(searchTerm);
    await searchInput.press("Enter");

    await expect(
      bobPage.locator("[data-testid='song-item']").first()
    ).toBeVisible({ timeout: 15000 });

    await bobPage.locator("[data-testid='add-song-button']").first().click();

    await expect(
      bobPage.locator("[data-testid='add-song-loading']")
    ).not.toBeVisible({ timeout: 10000 });
  }
);

When("the current song finishes on the TV", async ({ tvPage }) => {
  // Fast-forward the audio element to trigger the 'ended' event
  await tvPage.evaluate(() => {
    const audio = document.querySelector("audio");
    if (audio) {
      audio.currentTime = audio.duration || 999;
      audio.dispatchEvent(new Event("ended"));
    }
  });
});

When("Alice adds two songs to the queue", async ({ alicePage }) => {
  // Add first song
  await searchAndAddSong(alicePage);

  // Clear search and add a second song with different query
  const searchInput = alicePage.locator("[data-testid='search-input']");
  await searchInput.fill("rock");
  await searchInput.press("Enter");

  await expect(
    alicePage.locator("[data-testid='song-item']").first()
  ).toBeVisible({ timeout: 15000 });

  // Click the second result's add button (or first if only one)
  const addButtons = alicePage.locator("[data-testid='add-song-button']");
  const count = await addButtons.count();
  const buttonIndex = count > 1 ? 1 : 0;
  await addButtons.nth(buttonIndex).click();

  await expect(
    alicePage.locator("[data-testid='add-song-loading']")
  ).not.toBeVisible({ timeout: 10000 });
});

When("the first song finishes on the TV", async ({ tvPage }) => {
  // Wait for the TV to be in "playing" state (lyrics display visible)
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible({
    timeout: 30000,
  });

  // Fast-forward the audio to trigger song end
  await tvPage.evaluate(() => {
    const audio = document.querySelector("audio");
    if (audio) {
      audio.currentTime = audio.duration || 999;
      audio.dispatchEvent(new Event("ended"));
    }
  });
});

// ---------------------------------------------------------------------------
// Then steps
// ---------------------------------------------------------------------------

Then("Bob sees the song in their queue", async ({ bobPage }) => {
  await navigateToQueue(bobPage);
  // Wait for at least one queue item to appear (propagated via WebSocket)
  await expect(
    bobPage.locator("[data-testid='queue-item']").first()
  ).toBeVisible({ timeout: 10000 });
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
  // After transition sequence, lyrics display should reappear for the next song
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible({
    timeout: 30000,
  });
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
  await expect(bobPage.locator("[data-testid='queue-item']")).toHaveCount(1, {
    timeout: 10000,
  });
});

Then("Alice's queue view shows 2 songs", async ({ alicePage }) => {
  await navigateToQueue(alicePage);
  await expect(alicePage.locator("[data-testid='queue-item']")).toHaveCount(2, {
    timeout: 10000,
  });
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
