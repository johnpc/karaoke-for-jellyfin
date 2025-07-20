# Requirements Document

## Introduction

Karaoke For Jellyfin is a web-based karaoke system that integrates with Jellyfin media server to provide karaoke functionality. The system consists of a mobile-friendly web interface for song search and queue management, and a TV display interface for lyrics and playback control. Users can search for songs from their Jellyfin library on their phones, add them to a shared queue, and the songs will play with synchronized lyrics on the main TV screen.

## Requirements

### Requirement 1

**User Story:** As a karaoke host, I want to set up a self-hosted karaoke system, so that I can run karaoke sessions without relying on external services or expensive equipment.

#### Acceptance Criteria

1. WHEN the system is deployed THEN it SHALL run on a local network without internet dependency for core functionality
2. WHEN the host accesses the admin interface THEN the system SHALL provide controls for session management and settings
3. IF the system is running THEN it SHALL be accessible via web browsers on the local network

### Requirement 2

**User Story:** As a karaoke participant, I want to search for songs on my phone, so that I can find and queue songs I want to sing.

#### Acceptance Criteria

1. WHEN I access the web interface on my mobile device THEN the system SHALL display a responsive search interface
2. WHEN I enter search terms THEN the system SHALL return relevant song results with artist and title information
3. WHEN I select a song from search results THEN the system SHALL allow me to add it to the queue
4. IF the song library is large THEN the system SHALL provide fast search results within 2 seconds

### Requirement 3

**User Story:** As a karaoke participant, I want to see the current queue and my position, so that I know when my turn is coming up.

#### Acceptance Criteria

1. WHEN I access the queue view THEN the system SHALL display the current song queue in order
2. WHEN songs are added or removed THEN the queue SHALL update in real-time for all users
3. WHEN it's my turn THEN the system SHALL highlight my queued song
4. IF I have multiple songs queued THEN the system SHALL show all my songs with their positions

### Requirement 4

**User Story:** As a karaoke host, I want songs to play automatically from the queue on the TV, so that the session runs smoothly without manual intervention.

#### Acceptance Criteria

1. WHEN a song is at the front of the queue THEN the system SHALL automatically start playback on the TV display
2. WHEN a song finishes THEN the system SHALL automatically advance to the next song in the queue
3. IF the queue is empty THEN the system SHALL display a waiting screen on the TV
4. WHEN playback starts THEN the system SHALL remove the song from the queue

### Requirement 5

**User Story:** As a karaoke participant, I want to see synchronized lyrics on the TV screen, so that I can follow along while singing.

#### Acceptance Criteria

1. WHEN a song is playing THEN the system SHALL display lyrics synchronized with the audio
2. WHEN lyrics advance THEN the current line SHALL be highlighted or emphasized
3. IF lyrics are not available THEN the system SHALL display the song title and artist information
4. WHEN the song ends THEN the system SHALL display completion status before advancing

### Requirement 6

**User Story:** As a karaoke host, I want to control playback and manage the queue, so that I can handle technical issues and maintain session flow.

#### Acceptance Criteria

1. WHEN I access host controls THEN the system SHALL provide play, pause, skip, and volume controls
2. WHEN I need to reorder the queue THEN the system SHALL allow drag-and-drop queue management
3. WHEN I need to remove inappropriate songs THEN the system SHALL allow queue item deletion
4. IF technical issues occur THEN the system SHALL provide manual override controls

### Requirement 7

**User Story:** As a system administrator, I want to manage the song library through Jellyfin, so that I can leverage existing media management capabilities.

#### Acceptance Criteria

1. WHEN I add songs to Jellyfin THEN the karaoke system SHALL automatically discover them via Jellyfin's API
2. WHEN Jellyfin processes new media THEN the system SHALL sync the updated library for search
3. IF lyrics files are stored alongside audio files THEN the system SHALL detect and associate them
4. WHEN the Jellyfin library updates THEN songs SHALL become available for search and queueing without system restart

### Requirement 8

**User Story:** As a karaoke participant, I want the mobile interface to work well on my phone, so that I can easily interact with the system while socializing.

#### Acceptance Criteria

1. WHEN I access the interface on mobile THEN it SHALL be fully responsive and touch-friendly
2. WHEN I search or browse THEN the interface SHALL be optimized for small screens
3. WHEN multiple people use the system THEN it SHALL handle concurrent users without performance degradation
4. IF I lose connection briefly THEN the system SHALL reconnect automatically when possible
