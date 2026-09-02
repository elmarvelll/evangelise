# Viewer Statistics

Three distinct numbers, computed three different ways — never one number
reused for everything.

## Current viewers

**Not** stored in the database. `viewer-stats.service/get-live-viewer-count.ts`
asks LiveKit directly (`RoomServiceClient.listParticipants(roomName)`),
excluding the broadcaster's own identity. This is the number shown live in
`GET /api/livestreams/active`'s `currentViewerCount` and pushed via
`viewer_joined`/`viewer_left` SSE events. See
[../decisions/livestream-decisions.md](../decisions/livestream-decisions.md#current-viewer-count-read-from-livekit-not-a-presence-table)
for why this isn't a database counter.

## Peak viewers

`livestream.peakViewerCount` — persisted, raised whenever a fresh live
count (computed on a `participant_joined` webhook) exceeds the stored
value. Per-stream. `GET /api/users/[userId]/stats`'s `allTimePeakViewers`
is the max of this column across all of a user's streams.

## Total views

`livestream.totalViewCount` — persisted, incremented once per
`participant_joined` webhook event for a non-broadcaster identity. This is
a **lifetime join counter, not a unique-viewer count**: viewers are
anonymous (no user row, no de-duplication possible), so someone who leaves
and rejoins is counted twice. `GET /api/users/[userId]/stats`'s
`lifetimeViews` sums this column across all of a user's streams.

## Stream duration

Not a stored field — computed as `(endedAt ?? now) - startedAt` wherever
needed (not currently rendered anywhere in the UI in this pass; the
underlying `startedAt`/`endedAt` fields are available for it).

## Streamer overview

`GET /api/users/[userId]/stats` (`viewer-stats.service/get-streamer-overview.ts`,
private — only the user themselves can fetch their own): follower count,
total streams, lifetime views, all-time peak viewers. All real aggregate
queries (`prisma.livestream.aggregate`/`count`), rendered in
`src/components/stream/stats-panel.tsx`. `0` renders as `0`, not hidden.
