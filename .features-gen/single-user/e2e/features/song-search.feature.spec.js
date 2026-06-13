// Generated from: e2e/features/song-search.feature
import { test } from "playwright-bdd";

test.describe('Song Search', () => {

  test.beforeEach('Background', async ({ Given, And, page }, testInfo) => { if (testInfo.error) return;
    await Given('the user has completed setup with name "TestUser"', null, { page }); 
    await And('the search interface is visible', null, { page }); 
  });
  
  test('Search input is displayed', { tag: ['@mobile'] }, async ({ Then, And, page }) => { 
    await Then('I should see the search input field', null, { page }); 
    await And('the placeholder text should indicate searching for artists, albums, and songs', null, { page }); 
  });

  test('Search for a song by title', { tag: ['@mobile'] }, async ({ When, Then, And, page }) => { 
    await When('I type "Bohemian" in the search input', null, { page }); 
    await Then('I should see search results displayed', null, { page }); 
    await And('the results should include song items', null, { page }); 
  });

  test('Search for an artist', { tag: ['@mobile'] }, async ({ When, Then, And, page }) => { 
    await When('I type "Queen" in the search input', null, { page }); 
    await Then('I should see search results displayed', null, { page }); 
    await And('the results should include artist items', null, { page }); 
  });

  test('Browse artists without searching', { tag: ['@mobile'] }, async ({ When, Then, page }) => { 
    await When('the search interface loads', null, { page }); 
    await Then('I should see a list of artists', null, { page }); 
  });

  test('Select an artist to view their songs', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('artists are listed in the results', null, { page }); 
    await When('I click on an artist item', null, { page }); 
    await Then('I should see the artist\'s songs', null, { page }); 
    await And('I should see a back button to return to artists', null, { page }); 
  });

  test('Navigate back from artist songs', { tag: ['@mobile'] }, async ({ Given, When, Then, page }) => { 
    await Given('I am viewing songs for a selected artist', null, { page }); 
    await When('I click the back button', null, { page }); 
    await Then('I should see the artist list again', null, { page }); 
  });

  test('Select an album to view its songs', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('albums are listed in the results', null, { page }); 
    await When('I click on an album item', null, { page }); 
    await Then('I should see the album\'s songs', null, { page }); 
    await And('I should see a back button to return to albums', null, { page }); 
  });

  test('Add a song from search results', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('songs are listed in the results', null, { page }); 
    await When('I click the add button on a song', null, { page }); 
    await Then('I should see a confirmation dialog', null, { page }); 
    await And('the confirmation should indicate the song was added', null, { page }); 
  });

  test('Cannot add song when disconnected', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the WebSocket connection is lost', null, { page }); 
    await And('songs are listed in the results', null, { page }); 
    await When('I click the add button on a song', null, { page }); 
    await Then('I should see an error about not being connected', null, { page }); 
  });

  test('View playlists tab', { tag: ['@mobile'] }, async ({ When, Then, page }) => { 
    await When('I click the playlists tab', null, { page }); 
    await Then('I should see the playlists list', null, { page }); 
  });

  test('Select a playlist to view its songs', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the playlists tab is active', null, { page }); 
    await And('playlists are listed', null, { page }); 
    await When('I click on a playlist item', null, { page }); 
    await Then('I should see the playlist\'s songs', null, { page }); 
    await And('I should see a back button to return to playlists', null, { page }); 
  });

  test('Load more results', { tag: ['@mobile'] }, async ({ Given, When, Then, page }) => { 
    await Given('search results are paginated', null, { page }); 
    await When('I click the load more button', null, { page }); 
    await Then('additional results should be appended', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/song-search.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":11,"pickleLine":11,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then I should see the search input field","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And the placeholder text should indicate searching for artists, albums, and songs","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":15,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When I type \"Bohemian\" in the search input","stepMatchArguments":[{"group":{"start":7,"value":"\"Bohemian\"","children":[{"start":8,"value":"Bohemian","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then I should see search results displayed","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the results should include song items","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":20,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When I type \"Queen\" in the search input","stepMatchArguments":[{"group":{"start":7,"value":"\"Queen\"","children":[{"start":8,"value":"Queen","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then I should see search results displayed","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"And the results should include artist items","stepMatchArguments":[]}]},
  {"pwTestLine":28,"pickleLine":25,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the search interface loads","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then I should see a list of artists","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":29,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given artists are listed in the results","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When I click on an artist item","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then I should see the artist's songs","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"And I should see a back button to return to artists","stepMatchArguments":[]}]},
  {"pwTestLine":40,"pickleLine":35,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given I am viewing songs for a selected artist","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":37,"keywordType":"Action","textWithKeyword":"When I click the back button","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"Then I should see the artist list again","stepMatchArguments":[]}]},
  {"pwTestLine":46,"pickleLine":40,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"Given albums are listed in the results","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"When I click on an album item","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"Then I should see the album's songs","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"And I should see a back button to return to albums","stepMatchArguments":[]}]},
  {"pwTestLine":53,"pickleLine":46,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":47,"keywordType":"Context","textWithKeyword":"Given songs are listed in the results","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":48,"keywordType":"Action","textWithKeyword":"When I click the add button on a song","stepMatchArguments":[]},{"pwStepLine":56,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"Then I should see a confirmation dialog","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"And the confirmation should indicate the song was added","stepMatchArguments":[]}]},
  {"pwTestLine":60,"pickleLine":52,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":53,"keywordType":"Context","textWithKeyword":"Given the WebSocket connection is lost","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":54,"keywordType":"Context","textWithKeyword":"And songs are listed in the results","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":55,"keywordType":"Action","textWithKeyword":"When I click the add button on a song","stepMatchArguments":[]},{"pwStepLine":64,"gherkinStepLine":56,"keywordType":"Outcome","textWithKeyword":"Then I should see an error about not being connected","stepMatchArguments":[]}]},
  {"pwTestLine":67,"pickleLine":58,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":68,"gherkinStepLine":59,"keywordType":"Action","textWithKeyword":"When I click the playlists tab","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlists list","stepMatchArguments":[]}]},
  {"pwTestLine":72,"pickleLine":62,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":73,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given the playlists tab is active","stepMatchArguments":[]},{"pwStepLine":74,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"And playlists are listed","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":65,"keywordType":"Action","textWithKeyword":"When I click on a playlist item","stepMatchArguments":[]},{"pwStepLine":76,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then I should see the playlist's songs","stepMatchArguments":[]},{"pwStepLine":77,"gherkinStepLine":67,"keywordType":"Outcome","textWithKeyword":"And I should see a back button to return to playlists","stepMatchArguments":[]}]},
  {"pwTestLine":80,"pickleLine":69,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the user has completed setup with name \"TestUser\"","isBg":true,"stepMatchArguments":[{"group":{"start":39,"value":"\"TestUser\"","children":[{"start":40,"value":"TestUser","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the search interface is visible","isBg":true,"stepMatchArguments":[]},{"pwStepLine":81,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"Given search results are paginated","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":71,"keywordType":"Action","textWithKeyword":"When I click the load more button","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"Then additional results should be appended","stepMatchArguments":[]}]},
]; // bdd-data-end