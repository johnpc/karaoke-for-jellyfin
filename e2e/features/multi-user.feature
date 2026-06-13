@multi-user
Feature: Multi-User Queue Interaction
  As karaoke participants sharing a session
  We want to see each other's song additions in real-time
  And watch the queue advance as songs finish

  Scenario: Two users add songs and both see the shared queue
    Given "Alice" has joined the session on device 1
    And "Bob" has joined the session on device 2
    And the TV display is open
    When Alice adds a song to the queue
    Then Bob sees the song in their queue
    And the TV display shows the song playing

  Scenario: Queue advances when a song finishes
    Given "Alice" has joined the session on device 1
    And "Bob" has joined the session on device 2
    And the TV display is open
    When Alice adds "first song" to the queue
    And Bob adds "second song" to the queue
    Then the TV display shows the first song playing
    When the current song finishes on the TV
    Then the TV display shows the second song playing
    And both users see the queue updated

  Scenario: Users see each other's queue additions in real-time
    Given "Alice" has joined the session on device 1
    And "Bob" has joined the session on device 2
    When Alice adds a song to the queue
    Then Bob's queue view shows 1 song
    When Bob adds a song to the queue
    Then Alice's queue view shows 2 songs

  Scenario: TV shows waiting screen when queue is empty
    Given the TV display is open
    And no songs are in the queue
    Then the TV shows the waiting screen

  Scenario: Song transitions show rating and next-up splash
    Given "Alice" has joined the session on device 1
    And the TV display is open
    When Alice adds two songs to the queue
    And the first song finishes on the TV
    Then the TV shows a rating animation
    And then shows the next song splash
    And then starts playing the second song
