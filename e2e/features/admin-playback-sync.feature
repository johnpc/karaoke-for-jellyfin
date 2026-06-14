@multi-user
Feature: Admin Playback Sync
  As the karaoke admin
  I want to see real-time playback status on the admin page
  So that I can monitor and control the karaoke session

  Scenario: Admin sees playing status when a song is queued
    Given "Alice" has joined the karaoke session
    And the TV display is connected
    And the admin page is open
    When Alice adds a song to the queue
    Then the admin page should show "Playing" status
    And the admin page should show the seek control

  Scenario: Admin sees progress updates from the TV
    Given "Alice" has joined the karaoke session
    And the TV display is connected
    And the admin page is open
    When Alice adds a song to the queue
    Then the admin page seek slider should update over time
