# WebSocket Queue Synchronization Issue

## Problem

Songs added via mobile interface appear in:

- ✅ Mobile queue view
- ✅ TV Next Up card
- ❌ TV Host Controls (shows as empty)

## Root Cause

Two separate queue management systems:

1. WebSocket server (`server.js`) - handles real-time updates
2. Session Manager (`src/services/session.ts`) - handles API calls

The TV Host Controls uses the session manager, but songs are added via WebSocket server.

## Quick Fix Options

### Option 1: Make WebSocket server use Session Manager

Modify `server.js` to use the session manager instead of maintaining its own state.

### Option 2: Make Host Controls use WebSocket data

Modify Host Controls to get data from WebSocket instead of API calls.

### Option 3: Sync between systems

Add synchronization between WebSocket server and session manager.

## Recommended Solution

Option 1 - Use session manager in WebSocket server for consistency.

## Implementation Steps

1. Import session manager in server.js
2. Replace currentSession with sessionManager calls
3. Remove duplicate session state management
4. Test all functionality

## Files to Modify

- `server.js` - Use session manager
- Remove duplicate session state variables
- Ensure all WebSocket events use session manager
