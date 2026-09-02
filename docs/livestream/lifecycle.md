# Stream Lifecycle

## States (`livestream.status`)

- `SCHEDULED` — created with a future `scheduleDate`, not yet broadcasting.
  `startedAt` is `null`.
- `LIVE` — actively broadcasting. `startedAt` set the moment it goes live.
- `ENDED` — finished. `endedAt` set.

## Stream setup guard

Before a user reaches the live streamer interface, their stream-setup draft
must be complete: session name, description, at least one tag, **and**
category + genre (added in this pass). Enforced twice:

- **Client-side** (`isStreamSetupComplete`,
  `src/components/stream/utils/stream-session-storage.ts`): checked on
  `/stream/dashboard` load; an incomplete draft redirects to `/stream/new`.
  Good UX, not security.
- **Server-side** (`livestream.service/create-livestream.ts`): rejects a
  `POST /api/livekit/token` payload missing any required field with `400`,
  regardless of what the client checked. This is the actual guard — the
  client check only prevents a signed-in user from wasting a round trip.

## Starting

`createLivestream` (`livestream.service`) creates the row with `status:
"LIVE"` and `startedAt: now()` (for "go live now" — a scheduled stream's
`startedAt` stays `null` until it's actually started), validates category/
genre/tags/donation info, and publishes a `stream_started` activity event.

## Ending — three independent paths, one code path

Every path that ends a stream calls the same `endLivestream`
(`livestream.service`), which sets `status: "ENDED"`, `endedAt: now()`, and
publishes `stream_ended` — so the notification and the state change can
never happen independently of each other:

1. **Explicit**: `POST /api/livekit/livestreams/end` (the "End Stream"
   button).
2. **Reconnect grace period**: the LiveKit `participant_left` webhook, when
   the broadcaster's own identity disconnects — waits 30s for a heartbeat
   before ending, so a page refresh doesn't kill the stream.
3. **Stale-stream cron**: `GET /api/livekit/cleanup`, every 5 minutes,
   force-ends anything still `LIVE` with no heartbeat in 90 seconds — a
   backstop for when neither of the above fired (crash, lost connectivity).

See [../flows/go-live.md](../flows/go-live.md) for the full call-by-call
trace (still accurate after this pass — the underlying flow didn't change,
only what gets validated/published along the way).
