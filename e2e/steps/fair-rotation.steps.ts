import { expect, Page, BrowserContext } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";

const test = base.extend<{
  alicePage: Page;
  aliceContext: BrowserContext;
  bobPage: Page;
  bobContext: BrowserContext;
  charliePage: Page;
  charlieContext: BrowserContext;
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
  charlieContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  charliePage: async ({ charlieContext }, use) => {
    const page = await charlieContext.newPage();
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

async function clearQueue(page: Page): Promise<void> {
  const response = await page.request.get("http://localhost:3000/api/queue");
  const data = await response.json();
  const queue = data?.data?.queue || data?.queue || [];
  for (const item of queue) {
    if (item.status === "playing") {
      await page.request.put("http://localhost:3000/api/queue", {
        data: { action: "skip", userId: item.addedBy || "cleanup" },
      });
    } else {
      await page.request.delete(
        `http://localhost:3000/api/queue?itemId=${item.id}&userId=${item.addedBy || "cleanup"}`
      );
    }
  }
  const recheck = await page.request.get("http://localhost:3000/api/queue");
  const recheckData = await recheck.json();
  const remaining = recheckData?.data?.queue || recheckData?.queue || [];
  for (const item of remaining) {
    if (item.status === "playing") {
      await page.request.put("http://localhost:3000/api/queue", {
        data: { action: "skip", userId: item.addedBy || "cleanup" },
      });
    } else {
      await page.request.delete(
        `http://localhost:3000/api/queue?itemId=${item.id}&userId=${item.addedBy || "cleanup"}`
      );
    }
  }
}

async function joinSession(page: Page, userName: string): Promise<void> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await clearQueue(page);
  await page.evaluate(() => {
    localStorage.removeItem("karaoke-username");
  });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.locator("[data-testid='username-input']").fill(userName);
  await page.locator("[data-testid='join-session-button']").click();
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

async function addSongFromArtist(
  page: Page,
  artistIndex: number
): Promise<void> {
  await page.locator("[data-testid='search-tab']").click();
  await page.waitForTimeout(500);

  const backButton = page.locator("[data-testid='back-button']");
  if (await backButton.isVisible().catch(() => false)) {
    await backButton.click();
    await page.waitForTimeout(500);
  }

  await page
    .locator("[data-testid='artist-item']")
    .nth(artistIndex)
    .waitFor({ timeout: 60000 });

  await page.locator("[data-testid='artist-item']").nth(artistIndex).click();

  await page
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 30000 });

  await page.locator("[data-testid='add-song-button']").first().click();
  await dismissConfirmation(page);
}

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

Given(
  "{string} has joined the session on device 3",
  async ({ charliePage }, name: string) => {
    await joinSession(charliePage, name);
  }
);

Given("the queue is empty", async ({ alicePage }) => {
  await clearQueue(alicePage);
  await alicePage.waitForTimeout(1000);
});

When("Alice adds two songs to the queue", async ({ alicePage }) => {
  await addSongFromArtist(alicePage, 0);
  await addSongFromArtist(alicePage, 1);
});

When("Alice adds a song to the queue", async ({ alicePage }) => {
  await addSongFromArtist(alicePage, 0);
});

When("Bob adds a song to the queue", async ({ bobPage }) => {
  await addSongFromArtist(bobPage, 1);
});

When("Charlie adds a song to the queue", async ({ charliePage }) => {
  await addSongFromArtist(charliePage, 2);
});

async function getQueueFromSocket(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    return new Promise<string[]>(resolve => {
      const socket = (
        window as unknown as { __socket?: { emit: Function; on: Function } }
      ).__socket;
      if (!socket) {
        resolve([]);
        return;
      }
      socket.emit("get-queue");
      socket.on("queue-updated", (queue: Array<{ addedBy: string }>) => {
        resolve(queue.map(item => item.addedBy));
      });
      setTimeout(() => resolve([]), 3000);
    });
  });
}

Then("the queue shows Bob's song in second position", async ({ bobPage }) => {
  await bobPage.locator("[data-testid='queue-tab']").click();
  await bobPage.waitForTimeout(2000);

  const queueItems = bobPage.locator(
    "[data-testid='queue-item'], [data-testid='now-playing']"
  );
  await expect(queueItems.first()).toBeVisible({ timeout: 10000 });

  const count = await queueItems.count();
  expect(count).toBeGreaterThanOrEqual(2);

  // From Bob's view: now-playing (Alice), then Bob's song ("You" or "Your song")
  // Bob's song should be first in the pending list (second overall)
  const secondItem = queueItems.nth(1);
  const secondText = await secondItem.textContent();
  expect(secondText).toContain("You");
});

Then("the queue order is Alice, Bob, Charlie", async ({ charliePage }) => {
  await charliePage.locator("[data-testid='queue-tab']").click();
  await charliePage.waitForTimeout(2000);

  const queueItems = charliePage.locator(
    "[data-testid='queue-item'], [data-testid='now-playing']"
  );
  await expect(queueItems.first()).toBeVisible({ timeout: 10000 });

  const count = await queueItems.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // From Charlie's perspective: Alice's song, Bob's song, Charlie's ("You")
  const firstText = await queueItems.nth(0).textContent();
  const secondText = await queueItems.nth(1).textContent();
  const thirdText = await queueItems.nth(2).textContent();

  expect(firstText).toContain("Alice");
  expect(secondText).toContain("Bob");
  expect(thirdText).toContain("You");
});
