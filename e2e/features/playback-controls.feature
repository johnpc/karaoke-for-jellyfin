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

  Scenario: Volume slider adjusts volume
    Then I should see the volume slider
    When I set the volume to 50
    Then the volume display should show "50%"

  Scenario: Mute button toggles audio
    When I click the mute button
    Then the audio should be muted
    When I click the mute button again
    Then the audio should be unmuted

  Scenario: Lyrics timing offset adjustment
    Then I should see the lyrics timing control
    When I click the lyrics offset plus button
    Then the lyrics offset should increase by 1 second
    When I click the lyrics offset minus button
    Then the lyrics offset should decrease by 1 second

