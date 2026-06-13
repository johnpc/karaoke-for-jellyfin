// Generated from: e2e/features/playlist-browse.feature
import { test } from "playwright-bdd";

test.describe('Playlist Browsing', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('the user has completed setup with name "TestUser"', null, { page }); 
    await And('the search interface is visible', null, { page }); 
  });
  
  test('Navigate to playlists tab', { tag: ['@mobile'] }, async ({ When, Then, page }) => { 
    await When('I click the playlists tab', null, { page }); 
    await Then('I should see the playlists list', null, { page }); 
  });

  test('Select a playlist and view its songs', { tag: ['@mobile'] }, async ({ When, Then, And, page }) => { 
    await When('I click the playlists tab', null, { page }); 
    await And('playlists are listed', null, { page }); 
    await And('I click on a playlist item', null, { page }); 
    await Then('I should see the playlist\'s songs', null, { page }); 
    await And('I should see a back button to return to playlists', null, { page }); 
  });

  test('Navigate back from playlist songs', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the playlists tab is active', null, { page }); 
    await And('playlists are listed', null, { page }); 
    await When('I click on a playlist item', null, { page }); 
    await Then('I should see the playlist\'s songs', null, { page }); 
    await When('I click the back button', null, { page }); 
    await Then('I should see the playlists list', null, { page }); 
  });

  test('Add a song from a playlist to the queue', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the playlists tab is active', null, { page }); 
    await And('playlists are listed', null, { page }); 
    await When('I click on a playlist item', null, { page }); 
    await Then('I should see the playlist\'s songs', null, { page }); 
    await When('I click the add button on a song', null, { page }); 
    await Then('I should see a confirmation dialog', null, { page }); 
    await And('the confirmation should indicate the song was added', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/playlist-browse.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I click the playlists tab","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlists list","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":15,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When I click the playlists tab","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"And playlists are listed","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"And I click on a playlist item","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlist's songs","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And I should see a back button to return to playlists","stepMatchArguments":[]}]},
  {"pwTestLine":24,"pickleLine":22,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given the playlists tab is active","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"And playlists are listed","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When I click on a playlist item","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlist's songs","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"When I click the back button","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlists list","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":30,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given the playlists tab is active","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"And playlists are listed","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When I click on a playlist item","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlist's songs","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":35,"keywordType":"Action","textWithKeyword":"When I click the add button on a song","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"Then I should see a confirmation dialog","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"And the confirmation should indicate the song was added","stepMatchArguments":[]}]},
]; // bdd-data-end