@admin
Feature: Admin Controls
  As the karaoke admin
  I want to manage the queue and handle emergencies
  So that I can keep the karaoke event running smoothly

  Background:
    Given the admin interface is loaded at "/admin"

  Scenario: Admin interface shows all tabs
    Then I should see the playback tab
    And I should see the queue tab
    And I should see the emergency tab

  Scenario: Admin can navigate to queue tab
    When I click the queue tab
    Then I should see the queue management section

  Scenario: Emergency tab shows controls
    When I click the emergency tab
    Then I should see the emergency controls

  Scenario: System status section is visible
    When I click the emergency tab
    Then I should see the system status section
