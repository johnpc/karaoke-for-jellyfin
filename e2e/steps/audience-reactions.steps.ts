import { expect, Page, BrowserContext } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";

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

const BASE_URL = "http://localhost:3000";

async function clearQueue(page: Page): Promise<void> {
  const response = await page.request.get(`${BASE_URL}/api/queue`);
  const data = await response.json();
  if (data.queue) {
    for (const item of data.queue) {
      await page.request.delete(
        `${BASE_URL}/api/queue?queueItemId=${item.id}&userId=test`
      );
    }
  }
  await page.request.put(`${BASE_URL}/api/queue`, {
    data: { action: "skip", userId: "test" },
  });
}

async function joinSession(page: Page, userName: string): Promise<void> {
  await page.goto(BASE_URL);
  const nameInput = page.getByTestId("username-input");
  await nameInput.fill(userName);
  const joinButton = page.getByTestId("join-session-button");
  await joinButton.click();
  await page.waitForSelector('[data-testid="search-input"]', {
    timeout: 15000,
  });
}

async function addSongToQueue(page: Page): Promise<void> {
  const artistItem = page.getByTestId("artist-item").first();
  await artistItem.click();
  const addButton = page.getByTestId("add-song-button").first();
  await addButton.waitFor({ state: "visible", timeout: 30000 });
  await addButton.click();
  const dialog = page.locator("[data-testid='confirmation-dialog']");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("button[aria-label='Close']").click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
}

Given(
  "{string} has joined the session on device {int}",
  async ({ alicePage, bobPage }, name: string, device: number) => {
    const page = device === 1 ? alicePage : bobPage;
    if (device === 1) await clearQueue(page);
    await joinSession(page, name);
  }
);

Given("the TV display is open", async ({ tvPage }) => {
  await tvPage.goto(`${BASE_URL}/tv`);
  await tvPage.waitForSelector('[data-testid="tv-interface"]', {
    timeout: 15000,
  });
});

Given("a song is currently playing", async ({ alicePage }) => {
  await addSongToQueue(alicePage);
  await alicePage.waitForSelector('[data-testid="reactions-panel"]', {
    timeout: 30000,
  });
});

Given("no songs are in the queue", async ({ alicePage }) => {
  await clearQueue(alicePage);
});

async function openReactionsFab(page: Page): Promise<void> {
  const fab = page
    .getByTestId("reactions-panel")
    .locator("button[aria-label='Open reactions']");
  await fab.click();
}

When(
  "Alice sends a {string} reaction",
  async ({ alicePage }, emoji: string) => {
    await openReactionsFab(alicePage);
    const reactionButton = alicePage.getByTestId(`reaction-${emoji}`);
    await reactionButton.waitFor({ state: "visible", timeout: 10000 });
    await reactionButton.click();
  }
);

When("Bob sends a {string} reaction", async ({ bobPage }, emoji: string) => {
  await openReactionsFab(bobPage);
  const reactionButton = bobPage.getByTestId(`reaction-${emoji}`);
  await reactionButton.waitFor({ state: "visible", timeout: 10000 });
  await reactionButton.click();
});

Then(
  "the TV display shows the {string} reaction floating across the screen",
  async ({ tvPage }, emoji: string) => {
    const reaction = tvPage.getByTestId("floating-reaction").filter({
      hasText: emoji,
    });
    await reaction.waitFor({ state: "visible", timeout: 10000 });
  }
);

Then("the TV display shows both reactions", async ({ tvPage }) => {
  const reactions = tvPage.getByTestId("floating-reaction");
  await expect(reactions).toHaveCount(2, { timeout: 10000 });
});

Then("Alice does not see the reactions panel", async ({ alicePage }) => {
  const panel = alicePage.getByTestId("reactions-panel");
  await expect(panel).toHaveCount(0);
});

Then(
  "Alice sees the reactions panel with emoji options",
  async ({ alicePage }) => {
    const panel = alicePage.getByTestId("reactions-panel");
    await panel.waitFor({ state: "visible", timeout: 10000 });
  }
);

Then(
  "the available reactions include {string}, {string}, {string}, {string}, {string}, {string}",
  async (
    { alicePage },
    e1: string,
    e2: string,
    e3: string,
    e4: string,
    e5: string,
    e6: string
  ) => {
    await openReactionsFab(alicePage);
    for (const emoji of [e1, e2, e3, e4, e5, e6]) {
      const button = alicePage.getByTestId(`reaction-${emoji}`);
      await expect(button).toBeVisible();
    }
  }
);
