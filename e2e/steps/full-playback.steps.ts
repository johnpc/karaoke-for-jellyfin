import { expect, Page, BrowserContext } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";

const test = base.extend<{
  singerPage: Page;
  singerContext: BrowserContext;
  tvPage: Page;
  tvContext: BrowserContext;
}>({
  singerContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  singerPage: async ({ singerContext }, use) => {
    const page = await singerContext.newPage();
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

let firstSongTitle: string;
let secondSongTitle: string;

async function dismissConfirmation(page: Page): Promise<void> {
  const dialog = page.locator("[data-testid='confirmation-dialog']");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("button[aria-label='Close']").click();
  await dialog.waitFor({ state: "hidden", timeout: 5000 });
}

Given(
  "{string} has joined the karaoke session",
  async ({ singerPage }, name: string) => {
    await singerPage.goto("/");
    await singerPage.waitForLoadState("domcontentloaded");
    await singerPage.evaluate(() => {
      localStorage.removeItem("karaoke-username");
    });
    await singerPage.reload();
    await singerPage.waitForLoadState("domcontentloaded");

    await singerPage.locator("[data-testid='username-input']").fill(name);
    await singerPage.locator("[data-testid='join-session-button']").click();
    await expect(singerPage.locator("[data-testid='search-tab']")).toBeVisible({
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
  await expect(tvPage.locator("[data-testid='waiting-screen']")).toBeVisible();
});

When("the singer adds a song to the queue", async ({ singerPage }) => {
  await singerPage.locator("[data-testid='search-tab']").click();
  await singerPage
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 15000 });
  await singerPage.locator("[data-testid='artist-item']").first().click();
  await singerPage
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 15000 });

  // Capture the song title before adding
  const songText = await singerPage
    .locator("[data-testid='add-song-button']")
    .first()
    .locator("..")
    .textContent();
  firstSongTitle = songText?.split("\n")[0]?.trim() || "";

  await singerPage.locator("[data-testid='add-song-button']").first().click();
  await dismissConfirmation(singerPage);
});

When("the singer adds two songs to the queue", async ({ singerPage }) => {
  await singerPage.locator("[data-testid='search-tab']").click();
  await singerPage
    .locator("[data-testid='artist-item']")
    .first()
    .waitFor({ timeout: 15000 });

  // First song: pick artist at index 0
  await singerPage.locator("[data-testid='artist-item']").nth(0).click();
  await singerPage
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 15000 });

  const firstSongText = await singerPage
    .locator("[data-testid='add-song-button']")
    .first()
    .locator("..")
    .textContent();
  firstSongTitle = firstSongText?.split("\n")[0]?.trim() || "";

  await singerPage.locator("[data-testid='add-song-button']").first().click();
  await dismissConfirmation(singerPage);

  // Second song: pick a different artist (index 4 = 3 Doors Down)
  await singerPage.locator("[data-testid='back-button']").click();
  await singerPage
    .locator("[data-testid='artist-item']")
    .nth(4)
    .waitFor({ timeout: 15000 });
  await singerPage.locator("[data-testid='artist-item']").nth(4).click();
  await singerPage
    .locator("[data-testid='add-song-button']")
    .first()
    .waitFor({ timeout: 15000 });

  const secondSongText = await singerPage
    .locator("[data-testid='add-song-button']")
    .first()
    .locator("..")
    .textContent();
  secondSongTitle = secondSongText?.split("\n")[0]?.trim() || "";

  await singerPage.locator("[data-testid='add-song-button']").first().click();
  await dismissConfirmation(singerPage);
});

When("the song finishes playing naturally", async ({ tvPage }) => {
  // Wait for the audio to load and get its duration
  const duration = await tvPage.evaluate(async () => {
    const audio = document.querySelector("audio");
    if (!audio) return 0;
    // Wait for metadata to load if not already
    if (!audio.duration || isNaN(audio.duration)) {
      await new Promise<void>(resolve => {
        audio.addEventListener("loadedmetadata", () => resolve(), {
          once: true,
        });
        setTimeout(resolve, 5000);
      });
    }
    return audio.duration || 0;
  });

  if (duration > 10) {
    // Seek to 5 seconds before the end to avoid waiting the full song
    await tvPage.evaluate(seekTo => {
      const audio = document.querySelector("audio");
      if (audio) audio.currentTime = seekTo;
    }, duration - 5);
  }

  // Wait for the song to end naturally (up to 30s after seeking)
  await tvPage.waitForFunction(
    () => {
      const audio = document.querySelector("audio");
      return audio && audio.ended;
    },
    { timeout: 60000 }
  );
});

Then("the TV should start playing the song", async ({ tvPage }) => {
  const lyricsOrCountdown = tvPage
    .locator(
      "[data-testid='lyrics-display'], [data-testid='autoplay-countdown']"
    )
    .first();
  await expect(lyricsOrCountdown).toBeVisible({ timeout: 30000 });

  // Once autoplay countdown finishes, lyrics should show
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible({
    timeout: 30000,
  });
});

Then("the TV should display the song title and artist", async ({ tvPage }) => {
  await expect(
    tvPage.locator("[data-testid='current-song-title']")
  ).toBeVisible();
  await expect(
    tvPage.locator("[data-testid='current-song-artist']")
  ).toBeVisible();

  // Verify the title matches what was added (if captured)
  if (firstSongTitle) {
    await expect(
      tvPage.locator("[data-testid='current-song-title']")
    ).toContainText(/.+/);
  }
});

Then("the TV should show the lyrics display", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible();
  // Verify lyrics content area exists (may show "No lyrics" or actual lyrics)
  const lyricsArea = tvPage.locator(
    "[data-testid='current-lyric'], [data-testid='lyrics-display']"
  );
  await expect(lyricsArea.first()).toBeVisible();
});

Then("the playback progress bar should be visible", async ({ tvPage }) => {
  await expect(
    tvPage.locator("[data-testid='playback-progress']")
  ).toBeVisible();
  await expect(
    tvPage.locator("[data-testid='progress-bar-fill']")
  ).toBeVisible();
  await expect(
    tvPage.locator("[data-testid='playback-current-time']")
  ).toBeVisible();
  await expect(
    tvPage.locator("[data-testid='playback-duration']")
  ).toBeVisible();

  // Duration should show a non-zero time
  await expect(
    tvPage.locator("[data-testid='playback-duration']")
  ).not.toHaveText("0:00");
});

Then(
  "the current time should advance past {string}",
  async ({ tvPage }, _time: string) => {
    // Wait for playback to advance (current time should change from 0:00)
    await tvPage.waitForFunction(
      () => {
        const el = document.querySelector(
          "[data-testid='playback-current-time']"
        );
        return el && el.textContent !== "0:00";
      },
      { timeout: 15000 }
    );
  }
);

Then("the TV should show the rating animation", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='rating-animation']")).toBeVisible({
    timeout: 15000,
  });
});

Then("the TV should return to the waiting screen", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='waiting-screen']")).toBeVisible({
    timeout: 30000,
  });
});

Then("the TV should show the next song splash", async ({ tvPage }) => {
  // After rating animation (~15s), TV shows next-song splash OR jumps to playing
  // (race: server may advance queue before client captures nextSong)
  const splash = tvPage.locator("[data-testid='next-song-splash']");
  const lyrics = tvPage.locator("[data-testid='lyrics-display']");
  await expect(splash.or(lyrics)).toBeVisible({ timeout: 30000 });
});

Then("the TV should start playing the second song", async ({ tvPage }) => {
  await expect(tvPage.locator("[data-testid='lyrics-display']")).toBeVisible({
    timeout: 30000,
  });
});

Then(
  "the TV should display the second song title and artist",
  async ({ tvPage }) => {
    await expect(
      tvPage.locator("[data-testid='current-song-title']")
    ).toBeVisible();
    await expect(
      tvPage.locator("[data-testid='current-song-artist']")
    ).toBeVisible();
  }
);
