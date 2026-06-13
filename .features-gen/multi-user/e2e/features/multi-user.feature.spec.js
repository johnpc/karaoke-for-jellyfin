// Generated from: e2e/features/multi-user.feature
import { test } from "../../../../e2e/steps/multi-user.steps.ts";

test.describe("Multi-User Queue Interaction", () => {
  test(
    "Two users add songs and both see the shared queue",
    { tag: ["@multi-user"] },
    async ({ Given, When, Then, And, alicePage, bobPage, tvPage }) => {
      await Given('"Alice" has joined the session on device 1', null, {
        alicePage,
      });
      await And('"Bob" has joined the session on device 2', null, { bobPage });
      await And("the TV display is open", null, { tvPage });
      await When("Alice adds a song to the queue", null, { alicePage });
      await Then("Bob sees the song in their queue", null, { bobPage });
      await And("the TV display shows the song playing", null, { tvPage });
    }
  );

  test(
    "Queue advances when a song finishes",
    { tag: ["@multi-user"] },
    async ({ Given, When, Then, And, alicePage, bobPage, tvPage }) => {
      await Given('"Alice" has joined the session on device 1', null, {
        alicePage,
      });
      await And('"Bob" has joined the session on device 2', null, { bobPage });
      await And("the TV display is open", null, { tvPage });
      await When('Alice adds "first song" to the queue', null, { alicePage });
      await And('Bob adds "second song" to the queue', null, { bobPage });
      await Then("the TV display shows the first song playing", null, {
        tvPage,
      });
      await When("the current song finishes on the TV", null, { tvPage });
      await Then("the TV display shows the second song playing", null, {
        tvPage,
      });
      await And("both users see the queue updated", null, {
        alicePage,
        bobPage,
      });
    }
  );

  test(
    "Users see each other's queue additions in real-time",
    { tag: ["@multi-user"] },
    async ({ Given, When, Then, And, alicePage, bobPage }) => {
      await Given('"Alice" has joined the session on device 1', null, {
        alicePage,
      });
      await And('"Bob" has joined the session on device 2', null, { bobPage });
      await When("Alice adds a song to the queue", null, { alicePage });
      await Then("Bob's queue view shows 1 song", null, { bobPage });
      await When("Bob adds a song to the queue", null, { bobPage });
      await Then("Alice's queue view shows 2 songs", null, { alicePage });
    }
  );

  test(
    "TV shows waiting screen when queue is empty",
    { tag: ["@multi-user"] },
    async ({ Given, Then, And, tvPage }) => {
      await Given("the TV display is open", null, { tvPage });
      await And("no songs are in the queue", null, { tvPage });
      await Then("the TV shows the waiting screen", null, { tvPage });
    }
  );

  test(
    "Song transitions show rating and next-up splash",
    { tag: ["@multi-user"] },
    async ({ Given, When, Then, And, alicePage, tvPage }) => {
      await Given('"Alice" has joined the session on device 1', null, {
        alicePage,
      });
      await And("the TV display is open", null, { tvPage });
      await When("Alice adds two songs to the queue", null, { alicePage });
      await And("the first song finishes on the TV", null, { tvPage });
      await Then("the TV shows a rating animation", null, { tvPage });
      await And("then shows the next song splash", null, { tvPage });
      await And("then starts playing the second song", null, { tvPage });
    }
  );
});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: "test", box: true }],
  $uri: [
    ({}, use) => use("e2e/features/multi-user.feature"),
    { scope: "test", box: true },
  ],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [
  // bdd-data-start
  {
    pwTestLine: 6,
    pickleLine: 7,
    tags: ["@multi-user"],
    steps: [
      {
        pwStepLine: 7,
        gherkinStepLine: 8,
        keywordType: "Context",
        textWithKeyword: 'Given "Alice" has joined the session on device 1',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Alice"',
              children: [
                { start: 1, value: "Alice", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 8,
        gherkinStepLine: 9,
        keywordType: "Context",
        textWithKeyword: 'And "Bob" has joined the session on device 2',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Bob"',
              children: [
                { start: 1, value: "Bob", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 9,
        gherkinStepLine: 10,
        keywordType: "Context",
        textWithKeyword: "And the TV display is open",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 10,
        gherkinStepLine: 11,
        keywordType: "Action",
        textWithKeyword: "When Alice adds a song to the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 11,
        gherkinStepLine: 12,
        keywordType: "Outcome",
        textWithKeyword: "Then Bob sees the song in their queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 12,
        gherkinStepLine: 13,
        keywordType: "Outcome",
        textWithKeyword: "And the TV display shows the song playing",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 15,
    pickleLine: 15,
    tags: ["@multi-user"],
    steps: [
      {
        pwStepLine: 16,
        gherkinStepLine: 16,
        keywordType: "Context",
        textWithKeyword: 'Given "Alice" has joined the session on device 1',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Alice"',
              children: [
                { start: 1, value: "Alice", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 17,
        gherkinStepLine: 17,
        keywordType: "Context",
        textWithKeyword: 'And "Bob" has joined the session on device 2',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Bob"',
              children: [
                { start: 1, value: "Bob", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 18,
        gherkinStepLine: 18,
        keywordType: "Context",
        textWithKeyword: "And the TV display is open",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 19,
        gherkinStepLine: 19,
        keywordType: "Action",
        textWithKeyword: 'When Alice adds "first song" to the queue',
        stepMatchArguments: [
          {
            group: {
              start: 11,
              value: '"first song"',
              children: [
                { start: 12, value: "first song", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 20,
        gherkinStepLine: 20,
        keywordType: "Action",
        textWithKeyword: 'And Bob adds "second song" to the queue',
        stepMatchArguments: [
          {
            group: {
              start: 9,
              value: '"second song"',
              children: [
                { start: 10, value: "second song", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 21,
        gherkinStepLine: 21,
        keywordType: "Outcome",
        textWithKeyword: "Then the TV display shows the first song playing",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 22,
        gherkinStepLine: 22,
        keywordType: "Action",
        textWithKeyword: "When the current song finishes on the TV",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 23,
        gherkinStepLine: 23,
        keywordType: "Outcome",
        textWithKeyword: "Then the TV display shows the second song playing",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 24,
        gherkinStepLine: 24,
        keywordType: "Outcome",
        textWithKeyword: "And both users see the queue updated",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 27,
    pickleLine: 26,
    tags: ["@multi-user"],
    steps: [
      {
        pwStepLine: 28,
        gherkinStepLine: 27,
        keywordType: "Context",
        textWithKeyword: 'Given "Alice" has joined the session on device 1',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Alice"',
              children: [
                { start: 1, value: "Alice", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 29,
        gherkinStepLine: 28,
        keywordType: "Context",
        textWithKeyword: 'And "Bob" has joined the session on device 2',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Bob"',
              children: [
                { start: 1, value: "Bob", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 30,
        gherkinStepLine: 29,
        keywordType: "Action",
        textWithKeyword: "When Alice adds a song to the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 31,
        gherkinStepLine: 30,
        keywordType: "Outcome",
        textWithKeyword: "Then Bob's queue view shows 1 song",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 32,
        gherkinStepLine: 31,
        keywordType: "Action",
        textWithKeyword: "When Bob adds a song to the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 33,
        gherkinStepLine: 32,
        keywordType: "Outcome",
        textWithKeyword: "Then Alice's queue view shows 2 songs",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 36,
    pickleLine: 34,
    tags: ["@multi-user"],
    steps: [
      {
        pwStepLine: 37,
        gherkinStepLine: 35,
        keywordType: "Context",
        textWithKeyword: "Given the TV display is open",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 38,
        gherkinStepLine: 36,
        keywordType: "Context",
        textWithKeyword: "And no songs are in the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 39,
        gherkinStepLine: 37,
        keywordType: "Outcome",
        textWithKeyword: "Then the TV shows the waiting screen",
        stepMatchArguments: [],
      },
    ],
  },
  {
    pwTestLine: 42,
    pickleLine: 39,
    tags: ["@multi-user"],
    steps: [
      {
        pwStepLine: 43,
        gherkinStepLine: 40,
        keywordType: "Context",
        textWithKeyword: 'Given "Alice" has joined the session on device 1',
        stepMatchArguments: [
          {
            group: {
              start: 0,
              value: '"Alice"',
              children: [
                { start: 1, value: "Alice", children: [{}] },
                { children: [{}] },
              ],
            },
            parameterTypeName: "string",
          },
        ],
      },
      {
        pwStepLine: 44,
        gherkinStepLine: 41,
        keywordType: "Context",
        textWithKeyword: "And the TV display is open",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 45,
        gherkinStepLine: 42,
        keywordType: "Action",
        textWithKeyword: "When Alice adds two songs to the queue",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 46,
        gherkinStepLine: 43,
        keywordType: "Action",
        textWithKeyword: "And the first song finishes on the TV",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 47,
        gherkinStepLine: 44,
        keywordType: "Outcome",
        textWithKeyword: "Then the TV shows a rating animation",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 48,
        gherkinStepLine: 45,
        keywordType: "Outcome",
        textWithKeyword: "And then shows the next song splash",
        stepMatchArguments: [],
      },
      {
        pwStepLine: 49,
        gherkinStepLine: 46,
        keywordType: "Outcome",
        textWithKeyword: "And then starts playing the second song",
        stepMatchArguments: [],
      },
    ],
  },
]; // bdd-data-end
