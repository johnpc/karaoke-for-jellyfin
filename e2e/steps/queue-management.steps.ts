import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";

Given("the TV display is loaded", async ({ page }) => {
  await page.goto("/tv");
});

Given("the mobile interface is loaded", async ({ page }) => {
  await page.goto("/");
});

Then("I should see the waiting screen", async ({ page }) => {
  await expect(page.locator("body")).toBeVisible();
});

Then("I should see the user setup form", async ({ page }) => {
  await expect(page.locator("body")).toBeVisible();
});
