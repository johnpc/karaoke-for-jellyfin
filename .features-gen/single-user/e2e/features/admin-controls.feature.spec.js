// Generated from: e2e/features/admin-controls.feature
import { test } from "playwright-bdd";

test.describe('Admin Controls', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('the admin interface is loaded at "/admin"', null, { page }); 
  });
  
  test('Admin interface shows all tabs', { tag: ['@admin'] }, async ({ Then, And, page }) => { 
    await Then('I should see the playback tab', null, { page }); 
    await And('I should see the queue tab', null, { page }); 
    await And('I should see the emergency tab', null, { page }); 
  });

  test('Admin can navigate to queue tab', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await When('I click the queue tab', null, { page }); 
    await Then('I should see the queue management section', null, { page }); 
  });

  test('Emergency tab shows controls', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await When('I click the emergency tab', null, { page }); 
    await Then('I should see the emergency controls', null, { page }); 
  });

  test('System status section is visible', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await When('I click the emergency tab', null, { page }); 
    await Then('I should see the system status section', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/admin-controls.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin interface is loaded at \"/admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":33,"value":"\"/admin\"","children":[{"start":34,"value":"/admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then I should see the playback tab","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And I should see the queue tab","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And I should see the emergency tab","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":15,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin interface is loaded at \"/admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":33,"value":"\"/admin\"","children":[{"start":34,"value":"/admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When I click the queue tab","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then I should see the queue management section","stepMatchArguments":[]}]},
  {"pwTestLine":21,"pickleLine":19,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin interface is loaded at \"/admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":33,"value":"\"/admin\"","children":[{"start":34,"value":"/admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When I click the emergency tab","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then I should see the emergency controls","stepMatchArguments":[]}]},
  {"pwTestLine":26,"pickleLine":23,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin interface is loaded at \"/admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":33,"value":"\"/admin\"","children":[{"start":34,"value":"/admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":27,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When I click the emergency tab","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then I should see the system status section","stepMatchArguments":[]}]},
]; // bdd-data-end