// Generated from: e2e/features/tv-display.feature
import { test } from "playwright-bdd";

test.describe('TV Display', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('the TV display is loaded', null, { page }); 
  });
  
  test('TV shows waiting screen when no song is playing', { tag: ['@tv'] }, async ({ Then, And, page }) => { 
    await Then('I should see the waiting screen', null, { page }); 
    await And('I should see the app title', null, { page }); 
    await And('I should see instructions for joining', null, { page }); 
  });

  test('TV shows connection status', { tag: ['@tv'] }, async ({ Then, page }) => { 
    await Then('I should see the connection status indicator', null, { page }); 
  });

  test('TV displays QR code for joining', { tag: ['@tv'] }, async ({ Then, page }) => { 
    await Then('I should see the QR code for joining the session', null, { page }); 
  });

  test('Keyboard shortcut H toggles host controls', { tag: ['@tv'] }, async ({ When, Then, page }) => { 
    await When('I press the "H" key', null, { page }); 
    await Then('I should see the host controls overlay', null, { page }); 
    await When('I press the "Escape" key', null, { page }); 
    await Then('the host controls should be hidden', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/tv-display.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@tv"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the TV display is loaded","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then I should see the waiting screen","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And I should see the app title","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And I should see instructions for joining","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":15,"tags":["@tv"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the TV display is loaded","isBg":true,"stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then I should see the connection status indicator","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":18,"tags":["@tv"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the TV display is loaded","isBg":true,"stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then I should see the QR code for joining the session","stepMatchArguments":[]}]},
  {"pwTestLine":24,"pickleLine":21,"tags":["@tv"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the TV display is loaded","isBg":true,"stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When I press the \"H\" key","stepMatchArguments":[{"group":{"start":12,"value":"\"H\"","children":[{"start":13,"value":"H","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":26,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then I should see the host controls overlay","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When I press the \"Escape\" key","stepMatchArguments":[{"group":{"start":12,"value":"\"Escape\"","children":[{"start":13,"value":"Escape","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":28,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then the host controls should be hidden","stepMatchArguments":[]}]},
]; // bdd-data-end