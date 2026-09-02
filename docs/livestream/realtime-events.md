# Realtime Streamer Activity (SSE)

`GET /api/livestreams/[id]/activity` — Server-Sent Events. Only the
livestream's own owner may subscribe (session-derived identity, checked
against the livestream's actual `userId` — never a client claim).

## Transport

`src/lib/activity-bus.ts` — an in-process `EventEmitter`, one topic per
streamer (`userId`). The route opens a `ReadableStream`, subscribes on
`start`, unsubscribes on `cancel` (client disconnect). The frontend uses
the browser's native `EventSource` (`useActivityFeed`,
`src/components/stream/utils/use-activity-feed.ts`) — reconnection on drop
is automatic, no custom retry loop.

**Database is the source of truth; SSE is notification-only.** Every event
below describes something already persisted before it's published — a lost
event (dropped connection, process restart) never loses data, only a live
notification line the streamer's client would have shown.

## Events

| Event | Published by | When |
|---|---|---|
| `{ type: "follow", followerId, followerName }` | `follow.service/follow-user.ts` | A follow succeeds |
| `{ type: "viewer_joined", viewerCount }` | `livekit.service/handle-participant-joined.ts` | A LiveKit `participant_joined` webhook for a non-broadcaster identity |
| `{ type: "viewer_left", viewerCount }` | `livekit.service/handle-participant-left.ts` | A LiveKit `participant_left` webhook for a non-broadcaster identity |
| `{ type: "stream_started", livestreamId }` | `livestream.service/create-livestream.ts` | A stream goes live |
| `{ type: "stream_ended", livestreamId }` | `livestream.service/end-livestream.ts` | Any of the three end-of-stream paths (see [lifecycle.md](lifecycle.md)) |

`viewerCount` is the live LiveKit participant count at the moment of the
event (see [viewer-statistics.md](viewer-statistics.md)), not a database
counter — so it's always accurate even if an individual event is missed.

## Known limitation

Single-process only — does not fan out across multiple server instances.
See
[../decisions/livestream-decisions.md](../decisions/livestream-decisions.md#sse-activity-feed-in-process-pubsub-one-topic-per-streamer).
