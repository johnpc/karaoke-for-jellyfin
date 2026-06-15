@multi-user
Feature: Fair Queue Rotation
  As karaoke participants sharing a session
  We want songs to be ordered fairly across singers
  So that one person cannot monopolize the queue

  Scenario: Second user's song is placed before first user's second song
    Given "Alice" has joined the session on device 1
    And "Bob" has joined the session on device 2
    And the queue is empty
    When Alice adds two songs to the queue
    And Bob adds a song to the queue
    Then the queue shows Bob's song in second position

  Scenario: Three users get fair rotation
    Given "Alice" has joined the session on device 1
    And "Bob" has joined the session on device 2
    And "Charlie" has joined the session on device 3
    And the queue is empty
    When Alice adds a song to the queue
    And Bob adds a song to the queue
    And Charlie adds a song to the queue
    Then the queue order is Alice, Bob, Charlie
