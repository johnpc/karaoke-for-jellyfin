@admin
Feature: Playback Controls
  As the karaoke admin
  I want to control playback of the current song
  So that I can manage the karaoke experience

  Background:
    Given the admin has completed setup with name "Admin"
    And the admin is on the playback tab

  Scenario: Playback controls are displayed
    Then I should see the playback controls section
    And I should see the play/pause button
    And I should see the skip button

  Scenario: Play/pause button toggles playback
    Given a song is currently playing
    When I click the play/pause button
    Then the playback status should show "Paused"
    When I click the play/pause button again
    Then the playback status should show "Playing"

  Scenario: Skip button advances to next song
    Given a song is currently playing
    When I click the skip button
    Then the next song in the queue should start

  Scenario: Volume slider adjusts volume
    Then I should see the volume slider
    When I set the volume to 50
    Then the volume display should show "50%"

  Scenario: Mute button toggles audio
    When I click the mute button
    Then the audio should be muted
    When I click the mute button again
    Then the audio should be unmuted

  Scenario: Seek slider shows current position
    Given a song is currently playing
    Then I should see the seek control
    And the seek slider should show the current time
    And the seek slider should show the total duration

  Scenario: Seek to a specific position
    Given a song is currently playing
    When I drag the seek slider to a new position
    Then playback should resume from that position

  Scenario: Lyrics timing offset adjustment
    Then I should see the lyrics timing control
    When I click the lyrics offset plus button
    Then the lyrics offset should increase by 1 second
    When I click the lyrics offset minus button
    Then the lyrics offset should decrease by 1 second

  Scenario: Current song info is displayed
    Given a song is currently playing
    Then I should see the current song info
    And the song info should show the title and artist
