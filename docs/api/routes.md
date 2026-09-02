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
- **Purpose**: Public feed of every currently-`LIVE` stream, newest first.
  Powers the home dashboard.
- **Auth**: Public.
- **Controller**: `listLivestreamsController` (`src/app/api/livestreams/route.controller.ts`)
- **Service**: `listActiveLivestreams` (`src/services/livestream.service/`)
- **Response `200`**: `{ livestreams: Array<{ id, sessionName, sessionDescription, selectedTags: string[], status, user: { firstName, lastName } }> }`
- **Errors**: `500` on database failure.

### `GET /api/livestreams/active`
- **Purpose**: The signed-in user's own active (`LIVE`) stream, if any —
  used to restore the broadcaster dashboard after a page refresh.
- **Auth**: Required.
- **Controller**: `getActiveLivestreamController` (`src/app/api/livestreams/active/route.controller.ts`)
- **Service**: `getActiveLivestreamForUser` (`src/services/livestream.service/`)
- **Response `200`**: `{ isLive: true, livestream: { id, status, createdAt } }` or `{ isLive: false, livestream: null }`
- **Errors**: `401` no session, `500` unexpected failure.

### `GET /api/livestreams/comments/[streamId]`
- **Purpose**: List a stream's comments, oldest first, with a human-readable
  relative time (`"Just now"`, `"5m ago"`, …).
- **Auth**: Public.
- **Controller**: `listCommentsController` (`src/app/api/livestreams/comments/[streamId]/route.controller.ts`)
- **Service**: `listCommentsForStream` (`src/services/comment.service/`)
- **Response `200`**: `Array<{ id, name, text, time }>`
- **Errors**: `500` on database failure.

### `POST /api/livestreams/comments/[streamId]`
- **Purpose**: Post a comment on a stream.
- **Auth**: Required.
- **Controller**: `createCommentController` (same file as above)
- **Service**: `createComment` (`src/services/comment.service/`)
- **Body**: `{ text: string }`
- **Response `201`**: `{ id, name, text, time: "Just now" }`
- **Errors**:
  - `401` no session.
  - `400` empty comment, or over 500 characters.
  - `404` livestream doesn't exist.
  - `500` unexpected failure.
- **Note**: the frontend (`useSendComment`) also re-broadcasts the created
  comment over the LiveKit data channel so viewers in the room see it
  instantly, in addition to it being persisted here. See
  [../flows/post-comment.md](../flows/post-comment.md).

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
- **Body**: `{ sessionName, sessionDescription, selectedTags: string[] (1-3), interactionsEnabled?, streamMode?: "now"|"schedule", scheduleDate? }`
- **Response `200`**: `{ token, livestreamId, roomName, message }`
- **Errors**:
  - `401` no session.
  - `400` missing/invalid `sessionName`/`sessionDescription`/`selectedTags`,
    more than 3 tags, or an invalid `scheduleDate` when `streamMode` is
    `"schedule"`.
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

## Search

### `POST /api/search`
- **Purpose**: Search currently-`LIVE` streams by text (session name/
  description) and/or Christian topic tags.
- **Auth**: Public.
- **Controller**: `searchController` (`src/app/api/search/route.controller.ts`)
- **Params** (query string, not body — see note in
  [architecture.md](../architecture.md#known-architectural-issues-found-during-this-audit)):
  `q` (free text), `filters` (comma-separated tag list)
- **Service**: `searchLivestreams` (`src/services/search.service/`)
- **Response `200`**: `Array<{ id, type: "livestream", name, title, subtitle, tags }>`
  (empty array if both `q` and `filters` are empty — no unfiltered scan)
- **Errors**: `500` on database failure.

---

## Diagnostics

### `GET /api/test`
- **Purpose**: Database connectivity check (`SELECT 1`).
- **Auth**: Public.
- **Controller**: `healthCheckController` (`src/app/api/test/route.controller.ts`)
- **Response `200`**: `{ success: true, message: "Database connection successful" }`
- **Errors**: `500` `{ success: false, message: "Database connection failed" }`
