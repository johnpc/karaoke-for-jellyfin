@mobile
Feature: Song Search
  As a karaoke participant
  I want to search for songs by artist, album, or song name
  So that I can find and add songs to the queue

  Background:
    Given the user has completed setup with name "TestUser"
    And the search interface is visible

  Scenario: Search input is displayed
    Then I should see the search input field
    And the placeholder text should indicate searching for artists, albums, and songs

  Scenario: Search for a song by title
    When I type "Bohemian" in the search input
    Then I should see search results displayed
    And the results should include song items

  Scenario: Search for an artist
    When I type "Queen" in the search input
    Then I should see search results displayed
    And the results should include artist items

  Scenario: Browse artists without searching
    When the search interface loads
    Then I should see a list of artists

  Scenario: Select an artist to view their songs
    Given artists are listed in the results
    When I click on an artist item
    Then I should see the artist's songs
    And I should see a back button to return to artists

  Scenario: Navigate back from artist songs
    Given I am viewing songs for a selected artist
    When I click the back button
    Then I should see the artist list again

  Scenario: Select an album to view its songs
    Given albums are listed in the results
    When I click on an album item
    Then I should see the album's songs
    And I should see a back button to return to albums

  Scenario: Add a song from search results
    Given songs are listed in the results
    When I click the add button on a song
    Then I should see a confirmation dialog
    And the confirmation should indicate the song was added

  Scenario: Cannot add song when disconnected
    Given the WebSocket connection is lost
    And songs are listed in the results
    When I click the add button on a song
    Then I should see an error about not being connected

  Scenario: View playlists tab
    When I click the playlists tab
    Then I should see the playlists list

  Scenario: Select a playlist to view its songs
    Given the playlists tab is active
    And playlists are listed
    When I click on a playlist item
    Then I should see the playlist's songs
    And I should see a back button to return to playlists

  Scenario: Load more results
    Given search results are paginated
    When I click the load more button
    Then additional results should be appended
