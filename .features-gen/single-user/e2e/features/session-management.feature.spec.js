// Generated from: e2e/features/session-management.feature
import { test } from "playwright-bdd";

test.describe('Session Management', () => {

  test('User setup form is displayed on first visit', { tag: ['@mobile'] }, async ({ Given, Then, And, page }) => { 
    await Given('the mobile interface is loaded', null, { page }); 
    await And('no username is saved in local storage', null, { page }); 
    await Then('I should see the user setup form', null, { page }); 
    await And('I should see the username input field', null, { page }); 
    await And('I should see the join session button', null, { page }); 
  });

  test('Join session button is disabled without a name', { tag: ['@mobile'] }, async ({ Given, Then, And, page }) => { 
    await Given('the mobile interface is loaded', null, { page }); 
    await And('no username is saved in local storage', null, { page }); 
    await Then('the join session button should be disabled', null, { page }); 
  });

  test('User enters their name and joins', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the mobile interface is loaded', null, { page }); 
    await And('no username is saved in local storage', null, { page }); 
    await When('I enter "KaraokeKing" in the username input', null, { page }); 
    await And('I click the join session button', null, { page }); 
    await Then('I should see the main interface', null, { page }); 
  });

  test('User name is persisted across page reloads', { tag: ['@mobile'] }, async ({ Given, Then, page }) => { 
    await Given('the user has previously set up with name "ReturningUser"', null, { page }); 
    await Then('I should see the main interface', null, { page }); 
  });

  test('Connection status shows connected', { tag: ['@mobile'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user has completed setup with name "TestUser"', null, { page }); 
    await Then('I should see a green connection indicator', null, { page }); 
    await And('the connection status should show "Connected as TestUser"', null, { page }); 
  });

  test('Admin setup uses admin-specific title', { tag: ['@mobile'] }, async ({ Given, Then, And, page }) => { 
    await Given('the admin interface is loaded', null, { page }); 
    await And('no admin username is saved in local storage', null, { page }); 
    await Then('I should see the admin setup form', null, { page }); 
    await And('the title should say "Admin Setup"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/session-management.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":7,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the mobile interface is loaded","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And no username is saved in local storage","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then I should see the user setup form","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"And I should see the username input field","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And I should see the join session button","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":14,"tags":["@mobile"],"steps":[{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given the mobile interface is loaded","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"And no username is saved in local storage","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then the join session button should be disabled","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":19,"tags":["@mobile"],"steps":[{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given the mobile interface is loaded","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"And no username is saved in local storage","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When I enter \"KaraokeKing\" in the username input","stepMatchArguments":[{"group":{"start":8,"value":"\"KaraokeKing\"","children":[{"start":9,"value":"KaraokeKing","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"And I click the join session button","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then I should see the main interface","stepMatchArguments":[]}]},
  {"pwTestLine":28,"pickleLine":26,"tags":["@mobile"],"steps":[{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given the user has previously set up with name \"ReturningUser\"","stepMatchArguments":[{"group":{"start":41,"value":"\"ReturningUser\"","children":[{"start":42,"value":"ReturningUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then I should see the main interface","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":30,"tags":["@mobile"],"steps":[{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then I should see a green connection indicator","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"And the connection status should show \"Connected as TestUser\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Connected as TestUser\"","children":[{"start":35,"value":"Connected as TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":39,"pickleLine":35,"tags":["@mobile"],"steps":[{"pwStepLine":40,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given the admin interface is loaded","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"And no admin username is saved in local storage","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"Then I should see the admin setup form","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"And the title should say \"Admin Setup\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Admin Setup\"","children":[{"start":22,"value":"Admin Setup","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end