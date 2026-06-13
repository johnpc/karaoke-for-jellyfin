@mobile
Feature: Playlist Browsing
  As a karaoke participant
  I want to browse playlists and add songs from them
  So that I can quickly queue songs from curated collections

  Background:
    Given the user has completed setup with name "TestUser"
    And the search interface is visible

  Scenario: Navigate to playlists tab
    When I click the playlists tab
    Then I should see the playlists list

  Scenario: Select a playlist and view its songs
    When I click the playlists tab
    And playlists are listed
    And I click on a playlist item
    Then I should see the playlist's songs
    And I should see a back button to return to playlists

  Scenario: Navigate back from playlist songs
    Given the playlists tab is active
    And playlists are listed
    When I click on a playlist item
    Then I should see the playlist's songs
    When I click the back button
    Then I should see the playlists list

  Scenario: Add a song from a playlist to the queue
    Given the playlists tab is active
    And playlists are listed
    When I click on a playlist item
    Then I should see the playlist's songs
    When I click the add button on a song
    Then I should see a confirmation dialog
    And the confirmation should indicate the song was added
