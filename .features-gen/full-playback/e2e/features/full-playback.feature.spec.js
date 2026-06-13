// Generated from: e2e/features/full-playback.feature
import { test } from "../../../../e2e/steps/full-playback.steps.ts";

test.describe('Full Song Playback End-to-End', () => {

  test('Complete song playback with lyrics and progress', { tag: ['@full-playback'] }, async ({ Given, When, Then, And, singerPage, tvPage }) => { 
    await Given('"Singer" has joined the karaoke session', null, { singerPage }); 
    await And('the TV display is connected', null, { tvPage }); 
    await When('the singer adds a song to the queue', null, { singerPage }); 
    await Then('the TV should start playing the song', null, { tvPage }); 
    await And('the TV should display the song title and artist', null, { tvPage }); 
    await And('the TV should show the lyrics display', null, { tvPage }); 
    await And('the playback progress bar should be visible', null, { tvPage }); 
    await And('the current time should advance past "0:00"', null, { tvPage }); 
    await When('the song finishes playing naturally', null, { tvPage }); 
    await Then('the TV should show the rating animation', null, { tvPage }); 
    await And('the TV should return to the waiting screen', null, { tvPage }); 
  });

  test('Two songs play back-to-back with transition', { tag: ['@full-playback'] }, async ({ Given, When, Then, And, singerPage, tvPage }) => { 
    await Given('"Singer" has joined the karaoke session', null, { singerPage }); 
    await And('the TV display is connected', null, { tvPage }); 
    await When('the singer adds two songs to the queue', null, { singerPage }); 
    await Then('the TV should start playing the song', null, { tvPage }); 
    await And('the TV should display the song title and artist', null, { tvPage }); 
    await And('the playback progress bar should be visible', null, { tvPage }); 
    await When('the song finishes playing naturally', null, { tvPage }); 
    await Then('the TV should show the rating animation', null, { tvPage }); 
    await And('the TV should show the next song splash', null, { tvPage }); 
    await And('the TV should start playing the second song', null, { tvPage }); 
    await And('the TV should display the second song title and artist', null, { tvPage }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e/features/full-playback.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":7,"tags":["@full-playback"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given \"Singer\" has joined the karaoke session","stepMatchArguments":[{"group":{"start":0,"value":"\"Singer\"","children":[{"start":1,"value":"Singer","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And the TV display is connected","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When the singer adds a song to the queue","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then the TV should start playing the song","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And the TV should display the song title and artist","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And the TV should show the lyrics display","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And the playback progress bar should be visible","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And the current time should advance past \"0:00\"","stepMatchArguments":[{"group":{"start":37,"value":"\"0:00\"","children":[{"start":38,"value":"0:00","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When the song finishes playing naturally","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then the TV should show the rating animation","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the TV should return to the waiting screen","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":20,"tags":["@full-playback"],"steps":[{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"Given \"Singer\" has joined the karaoke session","stepMatchArguments":[{"group":{"start":0,"value":"\"Singer\"","children":[{"start":1,"value":"Singer","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"And the TV display is connected","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When the singer adds two songs to the queue","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then the TV should start playing the song","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And the TV should display the song title and artist","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"And the playback progress bar should be visible","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"When the song finishes playing naturally","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then the TV should show the rating animation","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"And the TV should show the next song splash","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"And the TV should start playing the second song","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And the TV should display the second song title and artist","stepMatchArguments":[]}]},
]; // bdd-data-end