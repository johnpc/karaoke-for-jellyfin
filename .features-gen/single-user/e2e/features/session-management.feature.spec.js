// Generated from: e2e/features/session-management.feature
import { test } from "playwright-bdd";

test.describe("Session Management", () => {
  test(
    "User setup form is displayed on first visit",
    { tag: ["@mobile"] },
    async ({ Given, Then, And, page }) => {
      await Given("the mobile interface is loaded", null, { page });
      await And("no username is saved in local storage", null, { page });
      await Then("I should see the user setup form", null, { page });
      await And("I should see the username input field", null, { page });
      await And("I should see the join session button", null, { page });
    }
  );

  test(
    "Join session button is disabled without a name",
    { tag: ["@mobile"] },
    async ({ Given, Then, And, page }) => {
      await Given("the mobile interface is loaded", null, { page });
      await And("no username is saved in local storage", null, { page });
      await Then("the join session button should be disabled", null, { page });
    }
  );

  test(
    "User enters their name and joins",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, And, page }) => {
      await Given("the mobile interface is loaded", null, { page });
      await And("no username is saved in local storage", null, { page });
      await When('I enter "KaraokeKing" in the username input', null, { page });
      await And("I click the join session button", null, { page });
      await Then("I should see the main interface", null, { page });
      await And(
        'the connection status should show "Connected as KaraokeKing"',
        null,
        { page }
      );
    }
  );

  test(
    "User name is persisted across page reloads",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, And, page }) => {
      await Given(
        'the user has previously set up with name "ReturningUser"',
        null,
        { page }
      );
      await When("the mobile interface is loaded", null, { page });
      await Then("I should see the main interface", null, { page });
      await And(
        'the connection status should show "Connected as ReturningUser"',
        null,
        { page }
      );
    }
  );

  test(
    "Connection status shows connected",
    { tag: ["@mobile"] },
    async ({ Given, Then, And, page }) => {
      await Given('the user has completed setup with name "TestUser"', null, {
        page,
      });
      await Then("I should see a green connection indicator", null, { page });
      await And(
        'the connection status should show "Connected as TestUser"',
        null,
        { page }
      );
    }
  );

  test(
    "Connection status shows reconnecting",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, And, page }) => {
      await Given('the user has completed setup with name "TestUser"', null, {
        page,
      });
      await When("the WebSocket connection is interrupted", null, { page });
      await Then("I should see a yellow pulsing connection indicator", null, {
        page,
      });
      await And('the connection status should show "Reconnecting..."', null, {
        page,
      });
    }
  );

  test(
    "Admin setup uses admin-specific title",
    { tag: ["@mobile"] },
    async ({ Given, Then, And, page }) => {
      await Given("the admin interface is loaded", null, { page });
      await And("no admin username is saved in local storage", null, { page });
      await Then("I should see the admin setup form", null, { page });
      await And('the title should say "Admin Setup"', null, { page });
    }
  );

  test(
    "Admin joins with admin suffix",
    { tag: ["@mobile"] },
    async ({ Given, When, Then, And, page }) => {
      await Given("the admin interface is loaded", null, { page });
      await And("no admin username is saved in local storage", null, { page });
      await When('I enter "Host" in the username input', null, { page });
      await And("I click the join session button", null, { page });
      await Then(
        'the connection status should show "Connected as Host (Admin)"',
        null,
        { page }
      );
    }
  );
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: "test", box: true }],
  $uri: [
    ({}, use) => use("e2e/features/session-management.feature"),
    { scope: "test", box: true },
  ],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 6,
    pickleLine: 7,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: "Given the mobile interface is loaded",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 8,
        gherkinStepLine: 9,
        keywordType: "Context",
        textWithKeyword: "And no username is saved in local storage",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 9,
        gherkinStepLine: 10,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the user setup form",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 10,
        gherkinStepLine: 11,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the username input field",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 11,
        gherkinStepLine: 12,
        keywordType: "Outcome",
        textWithKeyword: "And I should see the join session button",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 14,
    pickleLine: 14,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 15,
        gherkinStepLine: 15,
        keywordType: "Context",
        textWithKeyword: "Given the mobile interface is loaded",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 16,
        gherkinStepLine: 16,
        keywordType: "Context",
        textWithKeyword: "And no username is saved in local storage",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 17,
        gherkinStepLine: 17,
        keywordType: "Outcome",
        textWithKeyword: "Then the join session button should be disabled",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 20,
    pickleLine: 19,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 21,
        gherkinStepLine: 20,
        keywordType: "Context",
        textWithKeyword: "Given the mobile interface is loaded",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 22,
        gherkinStepLine: 21,
        keywordType: "Context",
        textWithKeyword: "And no username is saved in local storage",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 23,
        gherkinStepLine: 22,
        keywordType: "Action",
        textWithKeyword: 'When I enter "KaraokeKing" in the username input',
        stepMatchArguments: [
          {
            group: {
              start: 8,
              value: '"KaraokeKing"',
              children: [
                { start: 9, value: "KaraokeKing", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 24,
        gherkinStepLine: 23,
        keywordType: "Action",
        textWithKeyword: "And I click the join session button",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 25,
        gherkinStepLine: 24,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the main interface",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 26,
        gherkinStepLine: 25,
        keywordType: "Outcome",
        textWithKeyword:
          'And the connection status should show "Connected as KaraokeKing"',
        stepMatchArguments: [
          {
            group: {
              start: 34,
              value: '"Connected as KaraokeKing"',
              children: [
                {
                  start: 35,
                  value: "Connected as KaraokeKing",
                  children: [{}],
                },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
    ],
  },
  {
    pwTestLine: 29,
    pickleLine: 27,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 30,
        gherkinStepLine: 28,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has previously set up with name "ReturningUser"',
        stepMatchArguments: [
          {
            group: {
              start: 41,
              value: '"ReturningUser"',
              children: [
                { start: 42, value: "ReturningUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 31,
        gherkinStepLine: 29,
        keywordType: "Action",
        textWithKeyword: "When the mobile interface is loaded",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 32,
        gherkinStepLine: 30,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the main interface",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 33,
        gherkinStepLine: 31,
        keywordType: "Outcome",
        textWithKeyword:
          'And the connection status should show "Connected as ReturningUser"',
        stepMatchArguments: [
          {
            group: {
              start: 34,
              value: '"Connected as ReturningUser"',
              children: [
                {
                  start: 35,
                  value: "Connected as ReturningUser",
                  children: [{}],
                },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
    ],
  },
  {
    pwTestLine: 36,
    pickleLine: 33,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 37,
        gherkinStepLine: 34,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
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
        pwStepLine: 38,
        gherkinStepLine: 35,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see a green connection indicator",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 39,
        gherkinStepLine: 36,
        keywordType: "Outcome",
        textWithKeyword:
          'And the connection status should show "Connected as TestUser"',
        stepMatchArguments: [
          {
            group: {
              start: 34,
              value: '"Connected as TestUser"',
              children: [
                { start: 35, value: "Connected as TestUser", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
    ],
  },
  {
    pwTestLine: 42,
    pickleLine: 38,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 43,
        gherkinStepLine: 39,
        keywordType: "Context",
        textWithKeyword:
          'Given the user has completed setup with name "TestUser"',
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
        pwStepLine: 44,
        gherkinStepLine: 40,
        keywordType: "Action",
        textWithKeyword: "When the WebSocket connection is interrupted",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 45,
        gherkinStepLine: 41,
        keywordType: "Outcome",
        textWithKeyword:
          "Then I should see a yellow pulsing connection indicator",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 46,
        gherkinStepLine: 42,
        keywordType: "Outcome",
        textWithKeyword:
          'And the connection status should show "Reconnecting..."',
        stepMatchArguments: [
          {
            group: {
              start: 34,
              value: '"Reconnecting..."',
              children: [
                { start: 35, value: "Reconnecting...", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
    ],
  },
  {
    pwTestLine: 49,
    pickleLine: 44,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 50,
        gherkinStepLine: 45,
        keywordType: "Context",
        textWithKeyword: "Given the admin interface is loaded",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 51,
        gherkinStepLine: 46,
        keywordType: "Context",
        textWithKeyword: "And no admin username is saved in local storage",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 52,
        gherkinStepLine: 47,
        keywordType: "Outcome",
        textWithKeyword: "Then I should see the admin setup form",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 53,
        gherkinStepLine: 48,
        keywordType: "Outcome",
        textWithKeyword: 'And the title should say "Admin Setup"',
        stepMatchArguments: [
          {
            group: {
              start: 21,
              value: '"Admin Setup"',
              children: [
                { start: 22, value: "Admin Setup", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
    ],
  },
  {
    pwTestLine: 56,
    pickleLine: 50,
    tags: ["@mobile"],
    steps: [
      {
        pwStepLine: 57,
        gherkinStepLine: 51,
        keywordType: "Context",
        textWithKeyword: "Given the admin interface is loaded",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 58,
        gherkinStepLine: 52,
        keywordType: "Context",
        textWithKeyword: "And no admin username is saved in local storage",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 59,
        gherkinStepLine: 53,
        keywordType: "Action",
        textWithKeyword: 'When I enter "Host" in the username input',
        stepMatchArguments: [
          {
            group: {
              start: 8,
              value: '"Host"',
              children: [
                { start: 9, value: "Host", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 60,
        gherkinStepLine: 54,
        keywordType: "Action",
        textWithKeyword: "And I click the join session button",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 61,
        gherkinStepLine: 55,
        keywordType: "Outcome",
        textWithKeyword:
          'Then the connection status should show "Connected as Host (Admin)"',
        stepMatchArguments: [
          {
            group: {
              start: 34,
              value: '"Connected as Host (Admin)"',
              children: [
                {
                  start: 35,
                  value: "Connected as Host (Admin)",
                  children: [{}],
                },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
    ],
  },
]; // bdd-data-end
