@tv
Feature: TV Display
  As the karaoke host
  I want the TV to display lyrics, song info, and transitions
  So that singers can follow along and the audience is entertained

  Background:
    Given the TV display is loaded

  Scenario: TV shows waiting screen when no song is playing
    Then I should see the waiting screen
    And I should see the app title
    And I should see instructions for joining

  Scenario: TV shows connection status
    Then I should see the connection status indicator

  Scenario: TV displays QR code for joining
    Then I should see the QR code for joining the session

  Scenario: TV shows lyrics when a song is playing
    Given a song is currently playing on the TV
    Then I should see the lyrics display
    And I should see the current song title
    And I should see the current song artist

  Scenario: TV shows next up sidebar
    Given there are songs in the queue
    Then I should see the next up sidebar
    And the sidebar should show the next song's title and artist

  Scenario: TV shows rating animation after song ends
    Given a song has just completed
    Then I should see the rating animation
    And I should see the performance rating

  Scenario: TV shows next song splash during transition
    Given the rating animation has completed
    And there is a next song in the queue
    Then I should see the next song splash
    And I should see the next song title
    And I should see the countdown timer

  Scenario: Keyboard shortcut H toggles host controls
    When I press the "H" key
    Then I should see the host controls overlay
    When I press the "Escape" key
    Then the host controls should be hidden

  Scenario: Keyboard shortcut Q toggles queue preview
    When I press the "Q" key
    Then I should see the queue preview overlay
    When I press the "Escape" key
    Then the queue preview should be hidden

  Scenario: Keyboard shortcut Space toggles play/pause
    Given a song is currently playing on the TV
    When I press the "Space" key
    Then playback should be paused

  Scenario: Keyboard shortcut S skips the current song
    Given a song is currently playing on the TV
    When I press the "S" key
    Then the song should be skipped

  Scenario: Auto-play starts when first song is queued
    Given no song is currently playing
    When a song is added to the queue
    Then I should see the autoplay countdown
