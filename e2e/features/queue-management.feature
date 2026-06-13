Feature: Queue Management
  As a karaoke participant
  I want to manage the song queue
  So that I can add and view upcoming songs

  Scenario: View empty queue on TV display
    Given the TV display is loaded
    Then I should see the waiting screen

  Scenario: Mobile user sees the setup screen
    Given the mobile interface is loaded
    Then I should see the user setup form
