// Generated from: e2e/features/queue-management.feature
import { test } from "playwright-bdd";

test.describe("Queue Management", () => {
  test.beforeEach("Background", async ({ Given, page }, testInfo) => {
    if (testInfo.error) return;
    await Given('the user has completed setup with name "TestUser"', null, {
      page,
    });
  });

  test(
    "View empty queue",
    { tag: ["@mobile"] },
    async ({ When, Then, page }) => {
      await When("I navigate to the queue tab", null, { page });
      await Then("I should see the empty queue message", null, { page });
    }
  );

  test(
    "View queue with songs",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, And, page }) => {
      await Given("the queue has songs", null, { page });
      await When("I navigate to the queue tab", null, { page });
      await Then("I should see queue items listed", null, { page });
      await And("each queue item should show the song title and artist", null, {
        page,
      });
    }
  );

  test(
    "See now playing indicator",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, page }) => {
      await Given("a song is currently playing", null, { page });
      await When("I navigate to the queue tab", null, { page });
      await Then("I should see the now playing section", null, { page });
    }
  );

  test(
    "Remove own song from queue",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, page }) => {
      await Given('the queue has a song added by "TestUser"', null, { page });
      await When("I navigate to the queue tab", null, { page });
      await Then("I should see a remove button for my song", null, { page });
      await When("I click the remove button on my song", null, { page });
      await Then("the song should be removed from the queue", null, { page });
    }
  );

  test(
    "Cannot remove another user's song",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, page }) => {
      await Given('the queue has a song added by "OtherUser"', null, { page });
      await When("I navigate to the queue tab", null, { page });
      await Then("I should not see a remove button for that song", null, {
        page,
      });
    }
  );

  test(
    "Queue shows position numbers",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, page }) => {
      await Given("the queue has multiple songs", null, { page });
      await When("I navigate to the queue tab", null, { page });
      await Then("each queue item should display its position number", null, {
        page,
      });
    }
  );

  test(
    "Queue shows estimated total time",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, page }) => {
      await Given("the queue has multiple songs", null, { page });
      await When("I navigate to the queue tab", null, { page });
      await Then("I should see the estimated total time", null, { page });
    }
  );

  test(
    "Queue count badge on tab",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, page }) => {
      await Given("the queue has 3 pending songs", null, { page });
      await When("I view the navigation tabs", null, { page });
      await Then("the queue tab should show a badge with count 3", null, {
        page,
      });
    }
  );
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: "test", box: true }],
  $uri: [
    ({}, use) => use("e2e/features/queue-management.feature"),
    { scope: "test", box: true },
  ],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 10,
    pickleLine: 10,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
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
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 12,
        gherkinStepLine: 12,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the empty queue message",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 15,
    pickleLine: 14,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 16,
        gherkinStepLine: 15,
        keywordType: "Context",
        textWithKeyword: "Given the queue has songs",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 17,
        gherkinStepLine: 16,
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 18,
        gherkinStepLine: 17,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see queue items listed",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 19,
        gherkinStepLine: 18,
        keywordType: "Outcome",
        textWithKeyword:
          "And each queue item should show the song title and artist",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 22,
    pickleLine: 20,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
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
        textWithKeyword: "Given a song is currently playing",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 24,
        gherkinStepLine: 22,
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 25,
        gherkinStepLine: 23,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the now playing section",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 28,
    pickleLine: 25,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
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
        textWithKeyword: 'Given the queue has a song added by "TestUser"',
        stepMatchArguments: [
          {
            group: {
              start: 30,
              value: '"TestUser"',
              children: [
                { start: 31, value: "TestUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 30,
        gherkinStepLine: 27,
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 31,
        gherkinStepLine: 28,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see a remove button for my song",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 32,
        gherkinStepLine: 29,
        keywordType: "Action",
        textWithKeyword: "When I click the remove button on my song",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 33,
        gherkinStepLine: 30,
        keywordType: "Outcome",
        textWithKeyword: "Then the song should be removed from the queue",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 36,
    pickleLine: 32,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 37,
        gherkinStepLine: 33,
        keywordType: "Context",
        textWithKeyword: 'Given the queue has a song added by "OtherUser"',
        stepMatchArguments: [
          {
            group: {
              start: 30,
              value: '"OtherUser"',
              children: [
                { start: 31, value: "OtherUser", children: [{}] },
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
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 39,
        gherkinStepLine: 35,
        keywordType: "Outcome",
        textWithKeyword: "Then I should not see a remove button for that song",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 42,
    pickleLine: 37,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 43,
        gherkinStepLine: 38,
        keywordType: "Context",
        textWithKeyword: "Given the queue has multiple songs",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 44,
        gherkinStepLine: 39,
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 45,
        gherkinStepLine: 40,
        keywordType: "Outcome",
        textWithKeyword:
          "Then each queue item should display its position number",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 48,
    pickleLine: 42,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 49,
        gherkinStepLine: 43,
        keywordType: "Context",
        textWithKeyword: "Given the queue has multiple songs",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 50,
        gherkinStepLine: 44,
        keywordType: "Action",
        textWithKeyword: "When I navigate to the queue tab",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 51,
        gherkinStepLine: 45,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the estimated total time",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 54,
    pickleLine: 47,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
        isBg: true,
        stepMatchArguments: [
          {
            group: {
              start: 39,
              value: '"TestUser"',
              children: [
                { start: 40, value: "TestUser", children: [{}] },
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
        keywordType: "Context",
        textWithKeyword: "Given the queue has 3 pending songs",
        stepMatchArguments: [
          { group: { start: 14, value: "3" }, parameterTypeName: "int" },
        ],
      },
      {
        pwStepLine: 56,
        gherkinStepLine: 49,
        keywordType: "Action",
        textWithKeyword: "When I view the navigation tabs",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 57,
        gherkinStepLine: 50,
        keywordType: "Outcome",
        textWithKeyword: "Then the queue tab should show a badge with count 3",
        stepMatchArguments: [
          { group: { start: 45, value: "3" }, parameterTypeName: "int" },
        ],
      },
    ],
  },
]; // bdd-data-end
