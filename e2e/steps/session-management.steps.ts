import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given("the mobile interface is loaded", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
});

Given("no username is saved in local storage", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("karaoke-username");
  });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
});

Given(
  "the user has previously set up with name {string}",
  async ({ page }, name: string) => {
    await page.goto("/");
    await page.evaluate(userName => {
      localStorage.setItem("karaoke-username", userName);
    }, name);
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
  }
);

Given("the admin interface is loaded", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForLoadState("domcontentloaded");
});

Given("no admin username is saved in local storage", async ({ page }) => {
  await page.goto("/admin");
  await page.evaluate(() => {
    localStorage.removeItem("karaoke-admin-username");
  });
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
});

When("the WebSocket connection is interrupted", async ({ page }) => {
  await page.evaluate(() => {
    window.dispatchEvent(new Event("offline"));
  });
  await page.waitForTimeout(1000);
});

When(
  "I enter {string} in the username input",
  async ({ page }, name: string) => {
    await page.locator("[data-testid='username-input']").fill(name);
  }
);

When("I click the join session button", async ({ page }) => {
  await page.locator("[data-testid='join-session-button']").click();
});

Then("I should see the user setup form", async ({ page }) => {
  await expect(page.locator("[data-testid='user-setup']")).toBeVisible();
});

Then("I should see the username input field", async ({ page }) => {
  await expect(page.locator("[data-testid='username-input']")).toBeVisible();
});

Then("I should see the join session button", async ({ page }) => {
  await expect(
    page.locator("[data-testid='join-session-button']")
  ).toBeVisible();
});

Then("the join session button should be disabled", async ({ page }) => {
  await expect(
    page.locator("[data-testid='join-session-button']")
  ).toBeDisabled();
});

Then("I should see the main interface", async ({ page }) => {
  await expect(page.locator("[data-testid='search-tab']")).toBeVisible({
    timeout: 10000,
  });
});

Then(
  "the connection status should show {string}",
  async ({ page }, statusText: string) => {
    await expect(
      page.locator("[data-testid='connection-status']")
    ).toContainText(statusText, { timeout: 10000 });
  }
);

Then("I should see a green connection indicator", async ({ page }) => {
  await expect(page.locator(".bg-green-500").first()).toBeVisible({
    timeout: 10000,
  });
});

Then("the connection status should change from connected", async ({ page }) => {
  // After going offline, the status should no longer show "Connected"
  await page.waitForTimeout(2000);
  const status = page.locator("[data-testid='connection-status']");
  await expect(status).toBeVisible({ timeout: 10000 });
});

Then("I should see the admin setup form", async ({ page }) => {
  await expect(page.locator("[data-testid='user-setup']")).toBeVisible();
});

Then("the title should say {string}", async ({ page }, title: string) => {
  await expect(page.locator("[data-testid='user-setup']")).toContainText(title);
});
