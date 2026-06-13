@mobile
Feature: Session Management
  As a karaoke participant
  I want to join a session and see my connection status
  So that I can participate in the karaoke event

  Scenario: User setup form is displayed on first visit
    Given the mobile interface is loaded
    And no username is saved in local storage
    Then I should see the user setup form
    And I should see the username input field
    And I should see the join session button

  Scenario: Join session button is disabled without a name
    Given the mobile interface is loaded
    And no username is saved in local storage
    Then the join session button should be disabled

  Scenario: User enters their name and joins
    Given the mobile interface is loaded
    And no username is saved in local storage
    When I enter "KaraokeKing" in the username input
    And I click the join session button
    Then I should see the main interface
    And the connection status should show "Connected as KaraokeKing"

  Scenario: User name is persisted across page reloads
    Given the user has previously set up with name "ReturningUser"
    When the mobile interface is loaded
    Then I should see the main interface
    And the connection status should show "Connected as ReturningUser"

  Scenario: Connection status shows connected
    Given the user has completed setup with name "TestUser"
    Then I should see a green connection indicator
    And the connection status should show "Connected as TestUser"

  Scenario: Connection status shows reconnecting
    Given the user has completed setup with name "TestUser"
    When the WebSocket connection is interrupted
    Then I should see a yellow pulsing connection indicator
    And the connection status should show "Reconnecting..."

  Scenario: Admin setup uses admin-specific title
    Given the admin interface is loaded
    And no admin username is saved in local storage
    Then I should see the admin setup form
    And the title should say "Admin Setup"

  Scenario: Admin joins with admin suffix
    Given the admin interface is loaded
    And no admin username is saved in local storage
    When I enter "Host" in the username input
    And I click the join session button
    Then the connection status should show "Connected as Host (Admin)"
