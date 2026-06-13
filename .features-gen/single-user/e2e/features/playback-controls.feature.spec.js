// Generated from: e2e/features/playback-controls.feature
import { test } from "playwright-bdd";

test.describe('Playback Controls', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('the admin has completed setup with name "Admin"', null, { page }); 
    await And('the admin is on the playback tab', null, { page }); 
  });
  
  test('Playback controls are displayed', { tag: ['@admin'] }, async ({ Then, And, page }) => { 
    await Then('I should see the playback controls section', null, { page }); 
    await And('I should see the play/pause button', null, { page }); 
    await And('I should see the skip button', null, { page }); 
  });

  test('Volume slider adjusts volume', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await Then('I should see the volume slider', null, { page }); 
    await When('I set the volume to 50', null, { page }); 
    await Then('the volume display should show "50%"', null, { page }); 
  });

  test('Mute button toggles audio', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await When('I click the mute button', null, { page }); 
    await Then('the audio should be muted', null, { page }); 
    await When('I click the mute button again', null, { page }); 
    await Then('the audio should be unmuted', null, { page }); 
  });

  test('Lyrics timing offset adjustment', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await Then('I should see the lyrics timing control', null, { page }); 
    await When('I click the lyrics offset plus button', null, { page }); 
    await Then('the lyrics offset should increase by 1 second', null, { page }); 
    await When('I click the lyrics offset minus button', null, { page }); 
    await Then('the lyrics offset should decrease by 1 second', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/playback-controls.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then I should see the playback controls section","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And I should see the play/pause button","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And I should see the skip button","stepMatchArguments":[]}]},
  {"pwTestLine":17,"pickleLine":16,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then I should see the volume slider","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I set the volume to 50","stepMatchArguments":[{"group":{"start":20,"value":"50"},"parameterTypeName":"int"}]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the volume display should show \"50%\"","stepMatchArguments":[{"group":{"start":31,"value":"\"50%\"","children":[{"start":32,"value":"50%","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":23,"pickleLine":21,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When I click the mute button","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then the audio should be muted","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When I click the mute button again","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then the audio should be unmuted","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":27,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then I should see the lyrics timing control","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"When I click the lyrics offset plus button","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then the lyrics offset should increase by 1 second","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When I click the lyrics offset minus button","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then the lyrics offset should decrease by 1 second","stepMatchArguments":[]}]},
]; // bdd-data-end