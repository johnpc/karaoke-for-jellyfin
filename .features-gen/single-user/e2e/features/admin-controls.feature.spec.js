// Generated from: e2e/features/admin-controls.feature
import { test } from "playwright-bdd";

test.describe("Admin Controls", () => {
  test.beforeEach("Background", async ({ Given, page }, testInfo) => {
    if (testInfo.error) return;
    await Given('the admin has completed setup with name "Admin"', null, {
      page,
    });
  });

  test(
    "Admin interface shows all tabs",
    { tag: ["@admin"] },
    async ({ Then, And, page }) => {
      await Then("I should see the playback tab", null, { page });
      await And("I should see the queue tab", null, { page });
      await And("I should see the emergency tab", null, { page });
    }
  );

  test(
    "Admin views the queue",
    { tag: ["@admin"] },
    async ({ When, Then, And, page }) => {
      await When("I click the queue tab", null, { page });
      await Then("I should see the queue management section", null, { page });
      await And("I should see the queue count", null, { page });
    }
  );

  test(
    "Admin sees empty queue message",
    { tag: ["@admin"] },
    async ({ Given, When, Then, page }) => {
      await Given("the queue is empty", null, { page });
      await When("I click the queue tab", null, { page });
      await Then("I should see that there are no songs in queue", null, {
        page,
      });
    }
  );

  test(
    "Admin views queue with songs",
    { tag: ["@admin"] },
    async ({ Given, When, Then, And, page }) => {
      await Given("the queue has songs", null, { page });
      await When("I click the queue tab", null, { page });
      await Then("I should see the admin queue list", null, { page });
      await And("each item should show the song title", null, { page });
      await And("each item should show the artist", null, { page });
      await And("each item should show who added it", null, { page });
    }
  );

  test(
    "Admin removes a song from the queue",
    { tag: ["@admin"] },
    async ({ Given, When, Then, And, page }) => {
      await Given("the queue has songs", null, { page });
      await When("I click the queue tab", null, { page });
      await And("I click the remove button on a queue item", null, { page });
      await Then("the song should be removed from the queue", null, { page });
      await And("the queue count should decrease", null, { page });
    }
  );

  test(
    "Emergency stop halts all playback",
    { tag: ["@admin"] },
    async ({ When, Then, page }) => {
      await When("I click the emergency tab", null, { page });
      await Then("I should see the emergency controls", null, { page });
      await When("I click the emergency stop button", null, { page });
      await Then("playback should stop immediately", null, { page });
    }
  );

  test(
    "Restart current song",
    { tag: ["@admin"] },
    async ({ Given, When, Then, And, page }) => {
      await Given("a song is currently playing", null, { page });
      await When("I click the emergency tab", null, { page });
      await And("I click the restart song button", null, { page });
      await Then("the song should restart from the beginning", null, { page });
    }
  );

  test(
    "System status shows connection info",
    { tag: ["@admin"] },
    async ({ When, Then, And, page }) => {
      await When("I click the emergency tab", null, { page });
      await Then("I should see the system status section", null, { page });
      await And("the connection indicator should show connected", null, {
        page,
      });
      await And("I should see the active user count", null, { page });
    }
  );

  test(
    "Cache management is available",
    { tag: ["@admin"] },
    async ({ When, Then, And, page }) => {
      await When("I click the emergency tab", null, { page });
      await Then("I should see the cache status section", null, { page });
      await And("I should see the clear cache button", null, { page });
    }
  );
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: "test", box: true }],
  $uri: [
    ({}, use) => use("e2e/features/admin-controls.feature"),
    { scope: "test", box: true },
  ],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 10,
    pickleLine: 10,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 11,
        gherkinStepLine: 11,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the playback tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 12,
        gherkinStepLine: 12,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 13,
        gherkinStepLine: 13,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the emergency tab",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 16,
    pickleLine: 15,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 17,
        gherkinStepLine: 16,
        keywordType: "Action",
        textWithKeyword: "When I click the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 18,
        gherkinStepLine: 17,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the queue management section",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 19,
        gherkinStepLine: 18,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the queue count",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 22,
    pickleLine: 20,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 23,
        gherkinStepLine: 21,
        keywordType: "Context",
        textWithKeyword: "Given the queue is empty",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 24,
        gherkinStepLine: 22,
        keywordType: "Action",
        textWithKeyword: "When I click the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 25,
        gherkinStepLine: 23,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see that there are no songs in queue",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 28,
    pickleLine: 25,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 29,
        gherkinStepLine: 26,
        keywordType: "Context",
        textWithKeyword: "Given the queue has songs",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 30,
        gherkinStepLine: 27,
        keywordType: "Action",
        textWithKeyword: "When I click the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 31,
        gherkinStepLine: 28,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the admin queue list",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 32,
        gherkinStepLine: 29,
        keywordType: "Outcome",
        textWithKeyword: "And each item should show the song title",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 33,
        gherkinStepLine: 30,
        keywordType: "Outcome",
        textWithKeyword: "And each item should show the artist",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 34,
        gherkinStepLine: 31,
        keywordType: "Outcome",
        textWithKeyword: "And each item should show who added it",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 37,
    pickleLine: 33,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 38,
        gherkinStepLine: 34,
        keywordType: "Context",
        textWithKeyword: "Given the queue has songs",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 39,
        gherkinStepLine: 35,
        keywordType: "Action",
        textWithKeyword: "When I click the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 40,
        gherkinStepLine: 36,
        keywordType: "Action",
        textWithKeyword: "And I click the remove button on a queue item",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 41,
        gherkinStepLine: 37,
        keywordType: "Outcome",
        textWithKeyword: "Then the song should be removed from the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 42,
        gherkinStepLine: 38,
        keywordType: "Outcome",
        textWithKeyword: "And the queue count should decrease",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 45,
    pickleLine: 40,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 46,
        gherkinStepLine: 41,
        keywordType: "Action",
        textWithKeyword: "When I click the emergency tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 47,
        gherkinStepLine: 42,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the emergency controls",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 48,
        gherkinStepLine: 43,
        keywordType: "Action",
        textWithKeyword: "When I click the emergency stop button",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 49,
        gherkinStepLine: 44,
        keywordType: "Outcome",
        textWithKeyword: "Then playback should stop immediately",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 52,
    pickleLine: 46,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 53,
        gherkinStepLine: 47,
        keywordType: "Context",
        textWithKeyword: "Given a song is currently playing",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 54,
        gherkinStepLine: 48,
        keywordType: "Action",
        textWithKeyword: "When I click the emergency tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 55,
        gherkinStepLine: 49,
        keywordType: "Action",
        textWithKeyword: "And I click the restart song button",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 56,
        gherkinStepLine: 50,
        keywordType: "Outcome",
        textWithKeyword: "Then the song should restart from the beginning",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 59,
    pickleLine: 52,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 60,
        gherkinStepLine: 53,
        keywordType: "Action",
        textWithKeyword: "When I click the emergency tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 61,
        gherkinStepLine: 54,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the system status section",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 62,
        gherkinStepLine: 55,
        keywordType: "Outcome",
        textWithKeyword: "And the connection indicator should show connected",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 63,
        gherkinStepLine: 56,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the active user count",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 66,
    pickleLine: 58,
    tags: ["@admin"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the admin has completed setup with name "Admin"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 40,
              value: '"Admin"',
              children: [
                { start: 41, value: "Admin", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 67,
        gherkinStepLine: 59,
        keywordType: "Action",
        textWithKeyword: "When I click the emergency tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 68,
        gherkinStepLine: 60,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the cache status section",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 69,
        gherkinStepLine: 61,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the clear cache button",
        stepMatchArguments: [],
      },
    ],
  },
]; // bdd-data-end
