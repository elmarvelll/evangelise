# API Routes

All paths are relative to `/api`. "Auth" means a valid NextAuth session is
required (`getCurrentSession()` returns a user); "Public" means no session is
required.

---

## Auth

### `GET|POST /api/auth/[...nextauth]`
- **Purpose**: NextAuth's own catch-all handler (sign in/out, callback,
  session, CSRF, etc.).
- **Auth**: N/A (this route implements auth itself).
- **Handler**: `NextAuth(authOptions)` directly — no custom controller/service;
  see [`src/lib/auth.ts`](../../src/lib/auth.ts) for the provider/callback
  configuration and [authentication.md](../authentication.md) for details.

### `POST /api/register`
- **Purpose**: Create a new credentials-based account.
- **Auth**: Public.
- **Controller**: `registerController` (`src/app/api/register/route.controller.ts`)
- **Service**: `registerUser` (`src/services/auth.service/`)
- **Body**: `{ firstName, lastName, email, password }`
- **Response `201`**: `{ message, user: { id, firstName, lastName, email } }`
- **Errors**:
  - `400` — payload fails the `isSignupFormValues` shape check, a required
    field is blank, or password is under 8 characters.
  - `409` — email already registered (checked up front, and again against
    the database's unique constraint to close a signup race).
  - `500` — unexpected failure.

---

## Livestreams

### `GET /api/livestreams`
- **Purpose**: Public feed of currently-`LIVE` streams, newest first — and
  the app's one search endpoint. See [../livestream/search.md](../livestream/search.md)
  for the full parameter/pagination reference.
- **Auth**: Public.
- **Controller**: `listLivestreamsController` (`src/app/api/livestreams/route.controller.ts`)
- **Service**: `searchLivestreams` (`src/services/search.service/`)
- **Params** (query string, all optional/combinable): `search`, `category`,
  `genre`, `cursor`, `limit`
- **Response `200`**: `{ livestreams: Array<{ id, userId, sessionName, sessionDescription, selectedTags: string[], category, genre, status, donationEnabled, donationBankName, donationAccountName, donationAccountNumber, user: { firstName, lastName } }>, nextCursor: string | null }`
- **Errors**: `400` invalid `category`/`genre` value, `500` on database failure.

### `GET /api/livestreams/[id]/activity`
- **Purpose**: Server-Sent Events stream of a streamer's own realtime
  activity (follows, viewers joining/leaving, stream start/end). See
  [../livestream/realtime-events.md](../livestream/realtime-events.md).
- **Auth**: Required, and the caller must own the livestream.
- **Controller**: `activityStreamController` (`src/app/api/livestreams/[id]/activity/route.controller.ts`)
- **Errors**: `401` no session or not the owner, `404` livestream not found.

### `GET /api/livestreams/active`
- **Purpose**: The signed-in user's own active (`LIVE`) stream, if any —
  used to restore the broadcaster dashboard after a page refresh.
- **Auth**: Required.
- **Controller**: `getActiveLivestreamController` (`src/app/api/livestreams/active/route.controller.ts`)
- **Service**: `getActiveLivestreamForUser` + `getLiveViewerCount` (`src/services/livestream.service/`, `src/services/viewer-stats.service/`)
- **Response `200`**: `{ isLive: true, livestream: { id, status, createdAt, currentViewerCount } }` or `{ isLive: false, livestream: null }`
- **Errors**: `401` no session, `500` unexpected failure.

### `GET /api/livestreams/comments/[streamId]`
- **Purpose**: List a stream's comments, oldest first, with a human-readable
  relative time (`"Just now"`, `"5m ago"`, …). Soft-deleted comments are
  excluded.
- **Auth**: Public.
- **Controller**: `listCommentsController` (`src/app/api/livestreams/comments/[streamId]/route.controller.ts`)
- **Service**: `listCommentsForStream` (`src/services/comment.service/`)
- **Response `200`**: `Array<{ id, userId, name, text, time }>`
- **Errors**: `500` on database failure.

### `POST /api/livestreams/comments/[streamId]`
- **Purpose**: Post a comment on a stream.
- **Auth**: Required.
- **Controller**: `createCommentController` (same file as above)
- **Service**: `createComment` (`src/services/comment.service/`)
- **Body**: `{ text: string }`
- **Response `201`**: `{ id, userId, name, text, time: "Just now" }`
- **Errors**:
  - `401` no session.
  - `400` empty comment, or over 500 characters.
  - `404` livestream doesn't exist.
  - `429` more than 5 comments in 10 seconds from this user.
  - `500` unexpected failure.
- **Note**: the frontend (`useSendComment`) also re-broadcasts the created
  comment over the LiveKit data channel so viewers in the room see it
  instantly, in addition to it being persisted here. See
  [../flows/post-comment.md](../flows/post-comment.md).

### `DELETE /api/livestreams/comments/[streamId]/[commentId]`
- **Purpose**: Basic moderation — soft-deletes a comment (sets `deletedAt`,
  never removes the row). See [../livestream/moderation.md](../livestream/moderation.md).
- **Auth**: Required, and the caller must be either the comment's author or
  the livestream's owner.
- **Controller**: `deleteCommentController` (`src/app/api/livestreams/comments/[streamId]/[commentId]/route.controller.ts`)
- **Service**: `deleteComment` (`src/services/comment.service/`)
- **Response `200`**: `{ success: true }`
- **Errors**: `401` no session or not author/owner, `404` comment not found (or already deleted).

---

## Users

### `POST /api/users/[userId]/follow`
- **Purpose**: Follow the streamer at `userId`.
- **Auth**: Required — follower identity is the session's own id, never a
  client-supplied value.
- **Controller**: `followController` (`src/app/api/users/[userId]/follow/route.controller.ts`)
- **Service**: `followUser` (`src/services/follow.service/`)
- **Response `201`**: `{ success: true }`
- **Errors**: `400` self-follow or target doesn't exist, `409` already following.

### `DELETE /api/users/[userId]/follow`
- **Purpose**: Unfollow. Idempotent.
- **Auth**: Required.
- **Controller**: `unfollowController` (same file as above)
- **Service**: `unfollowUser` (`src/services/follow.service/`)
- **Response `200`**: `{ success: true }`

### `GET /api/users/[userId]/follow-status`
- **Purpose**: Follower count and (for a signed-in caller) whether they
  follow this user.
- **Auth**: Public.
- **Controller**: `followStatusController` (`src/app/api/users/[userId]/follow-status/route.controller.ts`)
- **Service**: `getFollowerCount`, `isFollowing` (`src/services/follow.service/`)
- **Response `200`**: `{ followerCount, isFollowing }`

### `GET /api/users/[userId]/stats`
- **Purpose**: A streamer's own aggregate stats.
- **Auth**: Required, and `userId` must match the caller — private to the
  streamer themselves.
- **Controller**: `streamerStatsController` (`src/app/api/users/[userId]/stats/route.controller.ts`)
- **Service**: `getStreamerOverview` (`src/services/viewer-stats.service/`)
- **Response `200`**: `{ followerCount, totalStreams, lifetimeViews, allTimePeakViewers }`
- **Errors**: `401` no session or viewing someone else's stats.

---

## Moderation

### `POST /api/reports`
- **Purpose**: Report a livestream or comment for later human review — no
  admin UI acts on these in this MVP. See [../livestream/moderation.md](../livestream/moderation.md).
- **Auth**: Required.
- **Controller**: `createReportController` (`src/app/api/reports/route.controller.ts`)
- **Service**: `createReport` (`src/services/report.service/`)
- **Body**: `{ targetType: "LIVESTREAM" | "COMMENT", targetId: string, reason: string }`
- **Response `201`**: `{ success: true }`
- **Errors**: `400` invalid `targetType`, missing `targetId`, or missing/too-long `reason`.

---

## LiveKit — broadcasting

### `POST /api/livekit/token`
- **Purpose**: The "go live" action — validates the stream-setup form,
  creates the `livestream` row, and issues a LiveKit **publisher** token for
  it.
- **Auth**: Required.
- **Controller**: `createBroadcastTokenController` (`src/app/api/livekit/token/route.controller.ts`)
- **Service**: `createBroadcastSession` (`src/services/livekit.service/`),
  which calls `createLivestream` (`src/services/livestream.service/`)
- **Body**: `{ sessionName, sessionDescription, selectedTags: string[] (1-3), category: StreamCategory, genre: StreamGenre, interactionsEnabled?, streamMode?: "now"|"schedule", scheduleDate?, donationEnabled?, donationBankName?, donationAccountName?, donationAccountNumber? }`
- **Response `200`**: `{ token, livestreamId, roomName, message }`
- **Errors**:
  - `401` no session.
  - `400` missing/invalid `sessionName`/`sessionDescription`/`selectedTags`,
    more than 3 tags, invalid/missing `category` or `genre`, an invalid
    `scheduleDate` when `streamMode` is `"schedule"`, or `donationEnabled:
    true` with any of the three bank fields missing.
  - `500` LiveKit credentials missing from the environment, or unexpected
    failure.
- ⚠️ See [architecture.md](../architecture.md#known-architectural-issues-found-during-this-audit)
  — the owning user is looked up by an upper-cased email, a pre-existing bug
  kept as-is.

### `POST /api/livekit/token/reconnect`
- **Purpose**: Issue a fresh publisher token for a stream the caller already
  owns and that is still `LIVE`, so a dropped connection can rejoin the same
  room without creating a new livestream.
- **Auth**: Required (and the livestream must belong to the caller).
- **Controller**: `createReconnectTokenController` (`src/app/api/livekit/token/reconnect/route.controller.ts`)
- **Service**: `createReconnectSession` (`src/services/livekit.service/`)
- **Body**: `{ livestreamId: string }`
- **Response `200`**: `{ token, livestreamId, roomName, message }`
- **Errors**: `401` no session, `400` missing `livestreamId`, `404` no
  matching active livestream owned by the caller, `500` LiveKit credentials
  missing or unexpected failure.

### `POST /api/livekit/heartbeat`
- **Purpose**: Periodic liveness ping from the broadcaster's client, recorded
  as `lastSeenAt` on the livestream row.
- **Auth**: Required (and the livestream must belong to the caller).
- **Controller**: `heartbeatController` (`src/app/api/livekit/heartbeat/route.controller.ts`)
- **Service**: `recordHeartbeat` (`src/services/livestream.service/`)
- **Body**: `{ roomId: string }` (the livestream id)
- **Response `200`**: `{ success: true }`
- **Errors**: `401` no session, `400` missing `roomId`, `404` no matching
  live stream owned by the caller, `500` unexpected failure.

### `POST /api/livekit/livestreams/end`
- **Purpose**: End a broadcast — deletes the LiveKit room, then marks the
  livestream `ENDED`.
- **Auth**: ⚠️ **None** — see the known-issues note in
  [architecture.md](../architecture.md#known-architectural-issues-found-during-this-audit).
  Kept as-is from the original implementation.
- **Controller**: `endBroadcastController` (`src/app/api/livekit/livestreams/end/route.controller.ts`)
- **Service**: `endBroadcastRoom` (`src/services/livekit.service/`)
- **Body**: `{ id: string }` (the livestream id, which is also the LiveKit room name)
- **Response `200`**: `{ success: true }`
- **Errors**: `404` livestream not found. An unexpected failure (e.g. LiveKit
  unreachable) is not caught and surfaces as Next's default `500`, matching
  the pre-refactor behavior.

### `POST /api/livekit/viewer_token`
- **Purpose**: Issue a subscribe-only token so anyone can watch a `LIVE`
  stream without an account.
- **Auth**: Public.
- **Controller**: `createViewerTokenController` (`src/app/api/livekit/viewer_token/route.controller.ts`)
- **Service**: `createViewerSession` (`src/services/livekit.service/`)
- **Body**: `{ id: string }` (the livestream id)
- **Response `200`**: `{ token, roomName }`
- **Errors**: `404` livestream not found, `400` livestream is no longer
  live, `500` LiveKit credentials missing or unexpected failure.

### `POST /api/livekit/webhook`
- **Purpose**: Receives LiveKit room events. Only `participant_left` is
  acted on: if the participant who left *is* the broadcaster (LiveKit
  identity equals the livestream id, this app's convention), the stream is
  given a 30-second grace period to reconnect (checked against
  `recordHeartbeat`'s `lastSeenAt`) before being marked `ENDED`. All other
  events are acknowledged and ignored.
- **Auth**: Verified via LiveKit's webhook signature (`Authorization` header
  + `WebhookReceiver`), not a user session.
- **Controller**: `livekitWebhookController` (`src/app/api/livekit/webhook/route.controller.ts`)
- **Service**: `verifyWebhookEvent`, `handleParticipantLeft` (`src/services/livekit.service/`)
- **Response `200`**: `{ received: true }` for every accepted webhook call.
- **Errors**: `401` missing `Authorization` header, `500` signature
  verification or processing failure.

### `GET /api/livekit/cleanup`
- **Purpose**: Cron sweep (see [`vercel.json`](../../vercel.json), every 5
  minutes) that ends any stream still `LIVE` whose last heartbeat is over 90
  seconds old — a safety net for streams whose `end`/webhook path never
  fired (e.g. the tab was killed).
- **Auth**: `Authorization: Bearer <CRON_SECRET>` header, checked against the
  `CRON_SECRET` env var.
- **Controller**: `cleanupController` (`src/app/api/livekit/cleanup/route.controller.ts`)
- **Service**: `cleanupStaleStreams` (`src/services/livestream.service/`)
- **Response `200`**: `{ success: true, endedCount: number }`
- **Errors**: `401` bad/missing bearer token, `500` `CRON_SECRET` not
  configured server-side, or unexpected failure.

---

## Search (retired)

### `POST /api/search`
- **Status**: **Retired** — superseded by `GET /api/livestreams?search=&category=&genre=`
  (see [../livestream/search.md](../livestream/search.md) and
  [../decisions/livestream-decisions.md](../decisions/livestream-decisions.md#search-one-query-not-two)).
  Always returns `410 Gone` with a message pointing at the replacement.
  Kept (rather than deleted) only so an old/cached client gets a clear
  signal instead of a broken 404.

---

## Diagnostics

### `GET /api/test`
- **Purpose**: Database connectivity check (`SELECT 1`).
- **Auth**: Public.
- **Controller**: `healthCheckController` (`src/app/api/test/route.controller.ts`)
- **Response `200`**: `{ success: true, message: "Database connection successful" }`
- **Errors**: `500` `{ success: false, message: "Database connection failed" }`
