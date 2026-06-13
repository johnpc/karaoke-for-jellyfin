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

  Scenario: Keyboard shortcut H toggles host controls
    When I press the "H" key
    Then I should see the host controls overlay
    When I press the "Escape" key
    Then the host controls should be hidden
