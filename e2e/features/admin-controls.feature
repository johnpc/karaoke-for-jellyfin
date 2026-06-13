@admin
Feature: Admin Controls
  As the karaoke admin
  I want to manage the queue and handle emergencies
  So that I can keep the karaoke event running smoothly

  Background:
    Given the admin has completed setup with name "Admin"

  Scenario: Admin interface shows all tabs
    Then I should see the playback tab
    And I should see the queue tab
    And I should see the emergency tab

  Scenario: Admin views the queue
    When I click the queue tab
    Then I should see the queue management section
    And I should see the queue count

  Scenario: Admin sees empty queue message
    Given the queue is empty
    When I click the queue tab
    Then I should see that there are no songs in queue

  Scenario: Admin views queue with songs
    Given the queue has songs
    When I click the queue tab
    Then I should see the admin queue list
    And each item should show the song title
    And each item should show the artist
    And each item should show who added it

  Scenario: Admin removes a song from the queue
    Given the queue has songs
    When I click the queue tab
    And I click the remove button on a queue item
    Then the song should be removed from the queue
    And the queue count should decrease

  Scenario: Emergency stop halts all playback
    When I click the emergency tab
    Then I should see the emergency controls
    When I click the emergency stop button
    Then playback should stop immediately

  Scenario: Restart current song
    Given a song is currently playing
    When I click the emergency tab
    And I click the restart song button
    Then the song should restart from the beginning

  Scenario: System status shows connection info
    When I click the emergency tab
    Then I should see the system status section
    And the connection indicator should show connected
    And I should see the active user count

  Scenario: Cache management is available
    When I click the emergency tab
    Then I should see the cache status section
    And I should see the clear cache button
