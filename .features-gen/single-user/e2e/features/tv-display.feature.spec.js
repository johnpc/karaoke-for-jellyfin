// Generated from: e2e/features/tv-display.feature
import { test } from "playwright-bdd";

test.describe("TV Display", () => {
  test.beforeEach("Background", async ({ Given, page }, testInfo) => {
    if (testInfo.error) return;
    await Given("the TV display is loaded", null, { page });
  });

  test(
    "TV shows waiting screen when no song is playing",
    { tag: ["@tv"] },
    async ({ Then, And, page }) => {
      await Then("I should see the waiting screen", null, { page });
      await And("I should see the app title", null, { page });
      await And("I should see instructions for joining", null, { page });
    }
  );

  test(
    "TV shows connection status",
    { tag: ["@tv"] },
    async ({ Then, page }) => {
      await Then("I should see the connection status indicator", null, {
        page,
      });
    }
  );

  test(
    "TV displays QR code for joining",
    { tag: ["@tv"] },
    async ({ Then, page }) => {
      await Then("I should see the QR code for joining the session", null, {
        page,
      });
    }
  );

  test(
    "TV shows lyrics when a song is playing",
    { tag: ["@tv"] },
    async ({ Given, Then, And, page }) => {
      await Given("a song is currently playing on the TV", null, { page });
      await Then("I should see the lyrics display", null, { page });
      await And("I should see the current song title", null, { page });
      await And("I should see the current song artist", null, { page });
    }
  );

  test(
    "TV shows next up sidebar",
    { tag: ["@tv"] },
    async ({ Given, Then, And, page }) => {
      await Given("there are songs in the queue", null, { page });
      await Then("I should see the next up sidebar", null, { page });
      await And(
        "the sidebar should show the next song's title and artist",
        null,
        { page }
      );
    }
  );

  test(
    "TV shows rating animation after song ends",
    { tag: ["@tv"] },
    async ({ Given, Then, And, page }) => {
      await Given("a song has just completed", null, { page });
      await Then("I should see the rating animation", null, { page });
      await And("I should see the performance rating", null, { page });
    }
  );

  test(
    "TV shows next song splash during transition",
    { tag: ["@tv"] },
    async ({ Given, Then, And, page }) => {
      await Given("the rating animation has completed", null, { page });
      await And("there is a next song in the queue", null, { page });
      await Then("I should see the next song splash", null, { page });
      await And("I should see the next song title", null, { page });
      await And("I should see the countdown timer", null, { page });
    }
  );

  test(
    "Keyboard shortcut H toggles host controls",
    { tag: ["@tv"] },
    async ({ When, Then, page }) => {
      await When('I press the "H" key', null, { page });
      await Then("I should see the host controls overlay", null, { page });
      await When('I press the "Escape" key', null, { page });
      await Then("the host controls should be hidden", null, { page });
    }
  );

  test(
    "Keyboard shortcut Q toggles queue preview",
    { tag: ["@tv"] },
    async ({ When, Then, page }) => {
      await When('I press the "Q" key', null, { page });
      await Then("I should see the queue preview overlay", null, { page });
      await When('I press the "Escape" key', null, { page });
      await Then("the queue preview should be hidden", null, { page });
    }
  );

  test(
    "Keyboard shortcut Space toggles play/pause",
    { tag: ["@tv"] },
    async ({ Given, When, Then, page }) => {
      await Given("a song is currently playing on the TV", null, { page });
      await When('I press the "Space" key', null, { page });
      await Then("playback should be paused", null, { page });
    }
  );

  test(
    "Keyboard shortcut S skips the current song",
    { tag: ["@tv"] },
    async ({ Given, When, Then, page }) => {
      await Given("a song is currently playing on the TV", null, { page });
      await When('I press the "S" key', null, { page });
      await Then("the song should be skipped", null, { page });
    }
  );

  test(
    "Auto-play starts when first song is queued",
    { tag: ["@tv"] },
    async ({ Given, When, Then, page }) => {
      await Given("no song is currently playing", null, { page });
      await When("a song is added to the queue", null, { page });
      await Then("I should see the autoplay countdown", null, { page });
    }
  );
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: "test", box: true }],
  $uri: [
    ({}, use) => use("e2e/features/tv-display.feature"),
    { scope: "test", box: true },
  ],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 10,
    pickleLine: 10,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 11,
        gherkinStepLine: 11,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the waiting screen",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 12,
        gherkinStepLine: 12,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the app title",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 13,
        gherkinStepLine: 13,
        keywordType: "Outcome",
        textWithKeyword: "And I should see instructions for joining",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 16,
    pickleLine: 15,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 17,
        gherkinStepLine: 16,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the connection status indicator",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 20,
    pickleLine: 18,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 21,
        gherkinStepLine: 19,
        keywordType: "Outcome",
        textWithKeyword:
          "Then I should see the QR code for joining the session",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 24,
    pickleLine: 21,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 25,
        gherkinStepLine: 22,
        keywordType: "Context",
        textWithKeyword: "Given a song is currently playing on the TV",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 26,
        gherkinStepLine: 23,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the lyrics display",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 27,
        gherkinStepLine: 24,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the current song title",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 28,
        gherkinStepLine: 25,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the current song artist",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 31,
    pickleLine: 27,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 32,
        gherkinStepLine: 28,
        keywordType: "Context",
        textWithKeyword: "Given there are songs in the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 33,
        gherkinStepLine: 29,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the next up sidebar",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 34,
        gherkinStepLine: 30,
        keywordType: "Outcome",
        textWithKeyword:
          "And the sidebar should show the next song's title and artist",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 37,
    pickleLine: 32,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 38,
        gherkinStepLine: 33,
        keywordType: "Context",
        textWithKeyword: "Given a song has just completed",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 39,
        gherkinStepLine: 34,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the rating animation",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 40,
        gherkinStepLine: 35,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the performance rating",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 43,
    pickleLine: 37,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 44,
        gherkinStepLine: 38,
        keywordType: "Context",
        textWithKeyword: "Given the rating animation has completed",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 45,
        gherkinStepLine: 39,
        keywordType: "Context",
        textWithKeyword: "And there is a next song in the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 46,
        gherkinStepLine: 40,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the next song splash",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 47,
        gherkinStepLine: 41,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the next song title",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 48,
        gherkinStepLine: 42,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the countdown timer",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 51,
    pickleLine: 44,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 52,
        gherkinStepLine: 45,
        keywordType: "Action",
        textWithKeyword: 'When I press the "H" key',
        stepMatchArguments: [
          {
            group: {
              start: 12,
              value: '"H"',
              children: [
                { start: 13, value: "H", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 53,
        gherkinStepLine: 46,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the host controls overlay",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 54,
        gherkinStepLine: 47,
        keywordType: "Action",
        textWithKeyword: 'When I press the "Escape" key',
        stepMatchArguments: [
          {
            group: {
              start: 12,
              value: '"Escape"',
              children: [
                { start: 13, value: "Escape", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 55,
        gherkinStepLine: 48,
        keywordType: "Outcome",
        textWithKeyword: "Then the host controls should be hidden",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 58,
    pickleLine: 50,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 59,
        gherkinStepLine: 51,
        keywordType: "Action",
        textWithKeyword: 'When I press the "Q" key',
        stepMatchArguments: [
          {
            group: {
              start: 12,
              value: '"Q"',
              children: [
                { start: 13, value: "Q", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 60,
        gherkinStepLine: 52,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the queue preview overlay",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 61,
        gherkinStepLine: 53,
        keywordType: "Action",
        textWithKeyword: 'When I press the "Escape" key',
        stepMatchArguments: [
          {
            group: {
              start: 12,
              value: '"Escape"',
              children: [
                { start: 13, value: "Escape", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 62,
        gherkinStepLine: 54,
        keywordType: "Outcome",
        textWithKeyword: "Then the queue preview should be hidden",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 65,
    pickleLine: 56,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 66,
        gherkinStepLine: 57,
        keywordType: "Context",
        textWithKeyword: "Given a song is currently playing on the TV",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 67,
        gherkinStepLine: 58,
        keywordType: "Action",
        textWithKeyword: 'When I press the "Space" key',
        stepMatchArguments: [
          {
            group: {
              start: 12,
              value: '"Space"',
              children: [
                { start: 13, value: "Space", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 68,
        gherkinStepLine: 59,
        keywordType: "Outcome",
        textWithKeyword: "Then playback should be paused",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 71,
    pickleLine: 61,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 72,
        gherkinStepLine: 62,
        keywordType: "Context",
        textWithKeyword: "Given a song is currently playing on the TV",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 73,
        gherkinStepLine: 63,
        keywordType: "Action",
        textWithKeyword: 'When I press the "S" key',
        stepMatchArguments: [
          {
            group: {
              start: 12,
              value: '"S"',
              children: [
                { start: 13, value: "S", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 74,
        gherkinStepLine: 64,
        keywordType: "Outcome",
        textWithKeyword: "Then the song should be skipped",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 77,
    pickleLine: 66,
    tags: ["@tv"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is loaded",
        isBg: true,
        stepMatchArguments: [],
      },
      {
        pwStepLine: 78,
        gherkinStepLine: 67,
        keywordType: "Context",
        textWithKeyword: "Given no song is currently playing",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 79,
        gherkinStepLine: 68,
        keywordType: "Action",
        textWithKeyword: "When a song is added to the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 80,
        gherkinStepLine: 69,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the autoplay countdown",
        stepMatchArguments: [],
      },
    ],
  },
]; // bdd-data-end
