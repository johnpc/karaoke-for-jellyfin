# Karaoke for Jellyfin

A karaoke app that streams music from a Jellyfin media server. Two interfaces: a mobile web UI for singers to browse/queue songs, and a TV display that shows lyrics, playback progress, and song transitions.

## Architecture

- **Next.js 16** (App Router, Turbopack) + **custom Node server** (`server.js`) for WebSocket support via Socket.IO
- `npm run dev` / `npm start` both run `server.js`, which boots Next.js internally and attaches Socket.IO
- The TV display (`/tv`) connects as a special "tv" client via WebSocket; mobile clients connect on join
- Queue state lives in-memory on the server (no database) — managed by `src/services/session.ts`

## Key Paths

| Area                                     | Path                                     |
| ---------------------------------------- | ---------------------------------------- |
| Custom server (WebSocket + queue logic)  | `server.js` (1100 lines — the "backend") |
| API routes (REST for queue, songs, etc.) | `src/app/api/`                           |
| TV display page                          | `src/app/tv/page.tsx`                    |
| Mobile entry page                        | `src/app/page.tsx`                       |
| TV components                            | `src/components/tv/`                     |
| Mobile components                        | `src/components/mobile/`                 |
| Hooks                                    | `src/hooks/`                             |
| Services (Jellyfin SDK, lyrics, search)  | `src/services/`                          |
| Shared types                             | `src/types/index.ts`                     |
| E2E features (Gherkin)                   | `e2e/features/`                          |
| E2E step definitions                     | `e2e/steps/`                             |
| Unit tests                               | `__tests__/`                             |

## Environment

Requires `.env.local` with:

```
JELLYFIN_SERVER_URL=<url>
JELLYFIN_API_KEY=<key>
JELLYFIN_USERNAME=<user>
```

## Commands

```bash
npm run dev          # Dev server (custom server.js with HMR via Next.js)
npm run build        # Production build
npm start            # Production server
npm test             # Unit tests (vitest)
npm run test:coverage # Unit tests with Istanbul coverage
npm run test:crap    # CRAP score check (threshold 15)
npm run test:acceptance # Full e2e: bddgen + playwright
npm run lint:check   # ESLint
npm run format:check # Prettier
```

## Testing

### Unit Tests

- Vitest + @testing-library/react + jsdom
- Coverage thresholds: 60% branches, 65% functions/lines/statements
- Config: `vitest.config.ts`
- Tests live in `__tests__/` mirroring `src/` structure

### E2E / Acceptance Tests

- **Playwright + playwright-bdd** (Gherkin `.feature` files)
- Three projects in `playwright.config.ts`:
  - `single-user` — headless, one browser context
  - `multi-user` — headless, multiple isolated contexts (Alice, Bob, TV)
  - `full-playback` — **headed** via xvfb in CI, uses real audio decoding
- Before running: `npx bddgen` regenerates `.features-gen/` from features + steps
- E2E tests hit a **real Jellyfin server** (not mocked) — timeouts must account for network latency

### CI

- GitHub Actions: `.github/workflows/ci.yml`
- Runs on PRs and pushes to main
- Steps: lint → format → unit tests → CRAP → build → playwright (headless) → playwright (headed/xvfb)
- Docker build (`.github/workflows/docker-publish.yml`) only runs on main pushes, not PRs
- Concurrency group cancels stale runs on new pushes

## TV Display Transition Flow

The TV cycles through display states managed by `TransitionState`:

```
waiting → playing → applause (rating animation) → next-up (splash) → playing (next song)
                                                 → waiting (if queue empty)
```

- `applause` state shows `RatingAnimation` with letter grade + "Up Next" info
- `next-up` state shows `NextSongSplash` before starting next song
- Song ratings are randomly generated server-side (`server.js` / `lib/ratingGenerator.ts`)

## WebSocket Events (server.js)

Key socket events: `join-session`, `add-song`, `remove-song`, `playback-control`, `skip-song`, `song-ended`, `start-next-song`

## Queue API (REST)

- `GET /api/queue` — current queue, playback state, session info
- `POST /api/queue` — add song (body: `{mediaItem, userId}`)
- `DELETE /api/queue?queueItemId=X&userId=Y` — remove song
- `PUT /api/queue` — actions like skip: `{action: "skip", userId: "..."}`

## E2E Testing Patterns

### Multi-user tests

- Use `clearQueue()` at the start of each scenario to prevent state bleed between tests
- Song additions use artist-item → add-song-button pattern (not search queries)
- `ConfirmationDialog` has a 2s auto-close but tests dismiss it explicitly via close button
- Song transitions in headless use API skip (`PUT /api/queue {action: "skip"}`) — audio `ended` events don't fire reliably in headless Chromium
- Queue assertions use `.or()` pattern: `queueItem.or(nowPlaying)` since first song auto-plays

### Full-playback tests (headed)

- Real audio playback with `--autoplay-policy=no-user-gesture-required`
- To avoid 3+ minute waits, seeks to 5s before end, then waits for natural `audio.ended`
- Next-song splash assertion uses `.or(lyrics)` to handle race where server advances before client captures nextSong
- `xvfb-run` provides the virtual display in CI

### Timeouts

- Remote Jellyfin API calls need 15s+ timeouts in CI (default 5s is too short)
- TV display transitions: 30s for lyrics/countdown to appear
- Full song playback: 60s for `audio.ended` after seeking

## Pre-commit Hooks

Husky + lint-staged runs: prettier → vitest → next build. All must pass before commit.
