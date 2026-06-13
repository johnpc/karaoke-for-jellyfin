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

  test('Play/pause button toggles playback', { tag: ['@admin'] }, async ({ Given, When, Then, page }) => { 
    await Given('a song is currently playing', null, { page }); 
    await When('I click the play/pause button', null, { page }); 
    await Then('the playback status should show "Paused"', null, { page }); 
    await When('I click the play/pause button again', null, { page }); 
    await Then('the playback status should show "Playing"', null, { page }); 
  });

  test('Skip button advances to next song', { tag: ['@admin'] }, async ({ Given, When, Then, page }) => { 
    await Given('a song is currently playing', null, { page }); 
    await When('I click the skip button', null, { page }); 
    await Then('the next song in the queue should start', null, { page }); 
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

  test('Seek slider shows current position', { tag: ['@admin'] }, async ({ Given, Then, And, page }) => { 
    await Given('a song is currently playing', null, { page }); 
    await Then('I should see the seek control', null, { page }); 
    await And('the seek slider should show the current time', null, { page }); 
    await And('the seek slider should show the total duration', null, { page }); 
  });

  test('Seek to a specific position', { tag: ['@admin'] }, async ({ Given, When, Then, page }) => { 
    await Given('a song is currently playing', null, { page }); 
    await When('I drag the seek slider to a new position', null, { page }); 
    await Then('playback should resume from that position', null, { page }); 
  });

  test('Lyrics timing offset adjustment', { tag: ['@admin'] }, async ({ When, Then, page }) => { 
    await Then('I should see the lyrics timing control', null, { page }); 
    await When('I click the lyrics offset plus button', null, { page }); 
    await Then('the lyrics offset should increase by 1 second', null, { page }); 
    await When('I click the lyrics offset minus button', null, { page }); 
    await Then('the lyrics offset should decrease by 1 second', null, { page }); 
  });

  test('Current song info is displayed', { tag: ['@admin'] }, async ({ Given, Then, And, page }) => { 
    await Given('a song is currently playing', null, { page }); 
    await Then('I should see the current song info', null, { page }); 
    await And('the song info should show the title and artist', null, { page }); 
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
  {"pwTestLine":17,"pickleLine":16,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given a song is currently playing","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the play/pause button","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the playback status should show \"Paused\"","stepMatchArguments":[{"group":{"start":32,"value":"\"Paused\"","children":[{"start":33,"value":"Paused","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When I click the play/pause button again","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then the playback status should show \"Playing\"","stepMatchArguments":[{"group":{"start":32,"value":"\"Playing\"","children":[{"start":33,"value":"Playing","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":25,"pickleLine":23,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given a song is currently playing","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When I click the skip button","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then the next song in the queue should start","stepMatchArguments":[]}]},
  {"pwTestLine":31,"pickleLine":28,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then I should see the volume slider","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When I set the volume to 50","stepMatchArguments":[{"group":{"start":20,"value":"50"},"parameterTypeName":"int"}]},{"pwStepLine":34,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then the volume display should show \"50%\"","stepMatchArguments":[{"group":{"start":31,"value":"\"50%\"","children":[{"start":32,"value":"50%","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":37,"pickleLine":33,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When I click the mute button","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the audio should be muted","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When I click the mute button again","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then the audio should be unmuted","stepMatchArguments":[]}]},
  {"pwTestLine":44,"pickleLine":39,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given a song is currently playing","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then I should see the seek control","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And the seek slider should show the current time","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"And the seek slider should show the total duration","stepMatchArguments":[]}]},
  {"pwTestLine":51,"pickleLine":45,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given a song is currently playing","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When I drag the seek slider to a new position","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"Then playback should resume from that position","stepMatchArguments":[]}]},
  {"pwTestLine":57,"pickleLine":50,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then I should see the lyrics timing control","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":52,"keywordType":"Action","textWithKeyword":"When I click the lyrics offset plus button","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then the lyrics offset should increase by 1 second","stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":54,"keywordType":"Action","textWithKeyword":"When I click the lyrics offset minus button","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":55,"keywordType":"Outcome","textWithKeyword":"Then the lyrics offset should decrease by 1 second","stepMatchArguments":[]}]},
  {"pwTestLine":65,"pickleLine":57,"tags":["@admin"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given the admin has completed setup with name \"Admin\"","isBg":true,"stepMatchArguments":[{"group":{"start":40,"value":"\"Admin\"","children":[{"start":41,"value":"Admin","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the admin is on the playback tab","isBg":true,"stepMatchArguments":[]},{"pwStepLine":66,"gherkinStepLine":58,"keywordType":"Context","textWithKeyword":"Given a song is currently playing","stepMatchArguments":[]},{"pwStepLine":67,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"Then I should see the current song info","stepMatchArguments":[]},{"pwStepLine":68,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"And the song info should show the title and artist","stepMatchArguments":[]}]},
]; // bdd-data-end