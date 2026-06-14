@multi-user
Feature: Audience Reactions
  As audience members watching a karaoke performance
  We want to send emoji reactions from our phones
  So that the TV display shows real-time encouragement

  Scenario: Audience member sends a reaction that appears on the TV
    Given "Alice" has joined the session on device 1
    And the TV display is open
    And a song is currently playing
    When Alice sends a "🔥" reaction
    Then the TV display shows the "🔥" reaction floating across the screen

  Scenario: Multiple users send reactions simultaneously
    Given "Alice" has joined the session on device 1
    And "Bob" has joined the session on device 2
    And the TV display is open
    And a song is currently playing
    When Alice sends a "🎤" reaction
    And Bob sends a "❤️" reaction
    Then the TV display shows both reactions

  Scenario: Reactions are only available during playback
    Given "Alice" has joined the session on device 1
    And no songs are in the queue
    Then Alice does not see the reactions panel

  Scenario: Reaction panel shows available emoji options
    Given "Alice" has joined the session on device 1
    And a song is currently playing
    Then Alice sees the reactions panel with emoji options
    And the available reactions include "🔥", "❤️", "🎤", "👏", "😂", "🙌"
