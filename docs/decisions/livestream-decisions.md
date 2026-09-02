# Livestream MVP — Architectural Decisions

Context for every non-obvious choice made building out the follower,
search, donation, viewer-stats, SSE, and moderation systems. Written
alongside the implementation, describing what was actually built.

## Category/genre: Prisma enums, not database tables

`StreamCategory` and `StreamGenre` are Prisma enums on `livestream`, not
their own tables. There is no admin UI in this app to manage a dynamic
taxonomy, and the value lists given in the spec read as a fixed set, not
something a non-engineer edits at runtime — exactly what an enum is for.
Adding a new value later is a migration, the same way adding a new
`livestream_status` value already is. The frontend's value list
(`src/lib/stream-taxonomy.ts`) is the one place a developer edits labels;
it must stay in sync with the Prisma enum (see the file's own comment).

## Current viewer count: read from LiveKit, not a presence table

Viewers are fully anonymous (`viewer-${uuid}` LiveKit identity, no user
row) — there's no viewer identity to track presence against in the
database. Rather than build a parallel "who's connected" table that could
drift from reality, `viewer-stats.service/get-live-viewer-count.ts` asks
LiveKit directly (`RoomServiceClient.listParticipants`) for the
authoritative live count, excluding the broadcaster's own identity.
`peakViewerCount` and `totalViewCount` *are* persisted on `livestream`
(they need to survive across time, unlike "who's here right now") and are
updated from the `participant_joined` webhook.

## SSE activity feed: in-process pub/sub, one topic per streamer

`src/lib/activity-bus.ts` is a plain Node `EventEmitter`, topic-keyed by
`userId`. Publishers: `follow.service` (a follow happened),
`livekit.service` (viewer joined/left), `livestream.service` (stream
started/ended — centralized in `endLivestream`/`createLivestream` so every
path that starts or ends a stream — explicit action, reconnect-grace-period
timeout, or the stale-stream cron — fires the notification exactly once).

**Known limitation**: this is single-process. It does not fan out across
multiple server instances — an event published on instance A never reaches
a streamer whose SSE connection landed on instance B. That's correct for
this app's current deployment (one Next.js process) and would need a
shared pub/sub (Redis, etc.) under multi-instance production traffic. The
database is never the *only* place this matters — every event describes
something already persisted (a `Follow` row, a viewer-count column, a
`livestream.status`), so a missed event is a missed live notification, not
lost data.

## Notifications: the SSE feed *is* the notification surface

There's no notification-center infrastructure in this app to integrate
with (checked — zero hits for "notification" anywhere in `src/` before this
work), and it doesn't appear in the MVP's Must/Next/Later priority list.
Rather than build a new persistent notification model, the SSE activity
feed serves the examples given ("someone followed you", "stream started/
ended") for a streamer while they're live. A durable, cross-session
notification center (bell icon, read/unread state, notifications that
survive not being live) is out of scope for this pass.

## Donations: fields on `livestream`, not `user`

Donation bank details are entered per-stream at setup time (matching the
spec's literal placement — "the stream should have appropriate fields
for... donation information"), not stored once on the user profile and
reused. `livestream.service/validate-donation-info.ts` enforces
all-three-or-none when `donationEnabled` is true, both in the create-
livestream service (server-side, authoritative) and in the setup form
(client-side, for immediate feedback) — the guard rule from section 3 of
the spec applies here too.

## Moderation: soft delete + stored reports, no admin UI

`Comment.deletedAt` is a soft delete (excluded from list queries, row kept
for audit) rather than a hard delete. `Report` rows are written by
`POST /api/reports` and just... sit there for later human review — there is
no admin screen to browse/act on them in this MVP, which matches "don't
over-engineer moderation for an MVP." Comment creation is rate-limited via
an in-memory sliding window (`src/lib/rate-limit.ts`) — same single-process
limitation as the activity bus, documented rather than silently assumed
away.

## Search: one query, not two

`GET /api/livestreams` is now the single implementation behind both "the
public feed" (no params) and "search" (`search`/`category`/`genre`, any
combination) — the same Prisma query with optional `AND` clauses, always
paginated via `take`/cursor. `POST /api/search` (the old, separate
implementation `SearchBar` used to call) is retired to an HTTP 410 with a
message pointing at the replacement, rather than deleted outright or left
silently duplicating logic — an old cached client gets a clear signal
instead of a broken 404 or two search engines that could disagree.
