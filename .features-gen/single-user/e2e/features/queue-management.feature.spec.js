// Generated from: e2e/features/queue-management.feature
import { test } from "playwright-bdd";

test.describe('Queue Management', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('the user has completed setup with name "TestUser"', null, { page }); 
  });
  
  test('View empty queue', { tag: ['@mobile'] }, async ({ Given, When, Then, page }) => { 
    await Given('the queue is cleared', null, { page }); 
    await When('I navigate to the queue tab', null, { page }); 
    await Then('I should see the empty queue message', null, { page }); 
  });

  test('Add song and view in queue', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the queue has songs', null, { page }); 
    await When('I navigate to the queue tab', null, { page }); 
    await Then('I should see queue items listed', null, { page }); 
    await And('each queue item should show the song title and artist', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/queue-management.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given the queue is cleared","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I navigate to the queue tab","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then I should see the empty queue message","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":15,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given the queue has songs","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When I navigate to the queue tab","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then I should see queue items listed","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And each queue item should show the song title and artist","stepMatchArguments":[]}]},
]; // bdd-data-end