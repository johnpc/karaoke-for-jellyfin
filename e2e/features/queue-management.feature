@mobile
Feature: Queue Management
  As a karaoke participant
  I want to manage the song queue
  So that I can add and view upcoming songs

  Background:
    Given the user has completed setup with name "TestUser"

  Scenario: View empty queue
    When I navigate to the queue tab
    Then I should see the empty queue message

  Scenario: View queue with songs
    Given the queue has songs
    When I navigate to the queue tab
    Then I should see queue items listed
    And each queue item should show the song title and artist

  Scenario: See now playing indicator
    Given a song is currently playing
    When I navigate to the queue tab
    Then I should see the now playing section

  Scenario: Remove own song from queue
    Given the queue has a song added by "TestUser"
    When I navigate to the queue tab
    Then I should see a remove button for my song
    When I click the remove button on my song
    Then the song should be removed from the queue

  Scenario: Cannot remove another user's song
    Given the queue has a song added by "OtherUser"
    When I navigate to the queue tab
    Then I should not see a remove button for that song

  Scenario: Queue shows position numbers
    Given the queue has multiple songs
    When I navigate to the queue tab
    Then each queue item should display its position number

  Scenario: Queue shows estimated total time
    Given the queue has multiple songs
    When I navigate to the queue tab
    Then I should see the estimated total time

  Scenario: Queue count badge on tab
    Given the queue has 3 pending songs
    When I view the navigation tabs
    Then the queue tab should show a badge with count 3
