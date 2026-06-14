import { expect, Page, BrowserContext } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";

const test = base.extend<{
  alicePage: Page;
  aliceContext: BrowserContext;
  tvPage: Page;
  tvContext: BrowserContext;
  adminPage: Page;
  adminContext: BrowserContext;
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
  tvContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  tvPage: async ({ tvContext }, use) => {
    const page = await tvContext.newPage();
    await use(page);
  },
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
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
}

async function dismissConfirmation(page: Page): Promise<void> {
  const dialog = page.locator("[data-testid='confirmation-dialog']");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("button[aria-label='Close']").click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
}

Given(
  "{string} has joined the karaoke session",
  async ({ alicePage }, name: string) => {
    await alicePage.goto("/");
    await alicePage.waitForLoadState("domcontentloaded");
    await clearQueue(alicePage);
    await alicePage.evaluate(() => {
      localStorage.removeItem("karaoke-username");
    });
    await alicePage.reload();
    await alicePage.waitForLoadState("domcontentloaded");
    await alicePage.locator("[data-testid='username-input']").fill(name);
    await alicePage.locator("[data-testid='join-session-button']").click();
    await expect(alicePage.locator("[data-testid='search-tab']")).toBeVisible({
      timeout: 10000,
    });
  }
);

Given("the TV display is connected", async ({ tvPage }) => {
  await tvPage.goto("/tv");
  await tvPage.waitForLoadState("domcontentloaded");
  await expect(
    tvPage.locator("[data-testid='connection-status']")
  ).toContainText("Connected", { timeout: 10000 });
});

Given("the admin page is open", async ({ adminPage }) => {
  await adminPage.goto("/admin");
  await adminPage.waitForLoadState("domcontentloaded");
  await adminPage.evaluate(() => {
    localStorage.setItem("karaoke-admin-username", "Admin (Admin)");
  });
  await adminPage.reload();
  await adminPage.waitForLoadState("domcontentloaded");
  await expect(
    adminPage.locator("[data-testid='playback-controls']")
  ).toBeVisible({ timeout: 15000 });
});

When("Alice adds a song to the queue", async ({ alicePage }) => {
  await alicePage.locator("[data-testid='search-tab']").click();
  await alicePage
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 60000 });
  await alicePage.locator("[data-testid='artist-item']").first().click();
  await alicePage
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 30000 });
  await alicePage.locator("[data-testid='add-song-button']").first().click();
  await dismissConfirmation(alicePage);
});

Then(
  "the admin page should show {string} status",
  async ({ adminPage }, status: string) => {
    await expect(
      adminPage.locator("[data-testid='playback-status']")
    ).toContainText(status, { timeout: 15000 });
  }
);

Then("the admin page should show the seek control", async ({ adminPage }) => {
  await expect(adminPage.locator("[data-testid='seek-control']")).toBeVisible({
    timeout: 30000,
  });
});

Then(
  "the admin page seek slider should update over time",
  async ({ adminPage }) => {
    await expect(adminPage.locator("[data-testid='seek-control']")).toBeVisible(
      { timeout: 30000 }
    );

    const getTime = async () => {
      const text = await adminPage
        .locator("[data-testid='seek-control']")
        .innerText();
      return text;
    };

    const firstReading = await getTime();
    await adminPage.waitForTimeout(4000);
    const secondReading = await getTime();
    expect(secondReading).not.toEqual(firstReading);
  }
);
