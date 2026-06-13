@full-playback
Feature: Full Song Playback End-to-End
  As a karaoke host
  I want to verify the complete playback flow works
  Including lyrics display, progress tracking, and song transitions

  Scenario: Complete song playback with lyrics and progress
    Given "Singer" has joined the karaoke session
    And the TV display is connected
    When the singer adds a song to the queue
    Then the TV should start playing the song
    And the TV should display the song title and artist
    And the TV should show the lyrics display
    And the playback progress bar should be visible
    And the current time should advance past "0:00"
    When the song finishes playing naturally
    Then the TV should show the rating animation
    And the TV should return to the waiting screen

  Scenario: Two songs play back-to-back with transition
    Given "Singer" has joined the karaoke session
    And the TV display is connected
    When the singer adds two songs to the queue
    Then the TV should start playing the song
    And the TV should display the song title and artist
    And the playback progress bar should be visible
    When the song finishes playing naturally
    Then the TV should show the rating animation
    And the TV should show the next song splash
    And the TV should start playing the second song
    And the TV should display the second song title and artist
