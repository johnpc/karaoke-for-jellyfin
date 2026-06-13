@mobile
Feature: Queue Management
  As a karaoke participant
  I want to manage the song queue
  So that I can add and view upcoming songs

  Background:
    Given the user has completed setup with name "TestUser"

  Scenario: View empty queue
    Given the queue is cleared
    When I navigate to the queue tab
    Then I should see the empty queue message

  Scenario: Add song and view in queue
    Given the queue has songs
    When I navigate to the queue tab
    Then I should see queue items listed
    And each queue item should show the song title and artist
