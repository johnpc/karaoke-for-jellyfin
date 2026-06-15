@mobile
Feature: Favorites and Song History
  As a returning karaoke singer
  I want to see songs I've previously queued and mark favorites
  So that I can quickly find and re-queue my go-to songs

  Background:
    Given the user has completed setup with name "TestUser"

  Scenario: Added song appears in My Songs history
    When I add a song to the queue
    And I navigate to the My Songs tab
    Then I should see the song in my history

  Scenario: Marking a song as favorite moves it to Favorites section
    When I add a song to the queue
    And I navigate to the My Songs tab
    And I tap the favorite button on the song
    Then the song appears in the Favorites section
