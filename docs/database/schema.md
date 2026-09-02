# Database Schema

Defined in [`prisma/schema.prisma`](../../prisma/schema.prisma), MySQL/MariaDB
via `@prisma/adapter-mariadb`. The Prisma client is a singleton exported from
[`src/lib/prisma.ts`](../../src/lib/prisma.ts) (cached on `globalThis` in
development to survive hot reload).

## Models

### `user`
The account record — created either at signup (`registerUser`) or on first
Google sign-in (`findOrCreateGoogleUser`).

| Field | Notes |
|---|---|
| `id` | `cuid()` primary key |
| `email` | Unique. Always stored lowercase (`registerUser`, `findOrCreateGoogleUser` both `.toLowerCase()` it before writing). |
| `password` | Nullable/empty for Google-only accounts — `verifyCredentials` treats a missing password as "can't sign in with credentials". Bcrypt-hashed (cost 12) for credentials accounts. |
| `firstName`, `lastName` | For Google accounts, derived by splitting the OAuth display name on whitespace. |

Relationships: one `user` → many `livestream` (as broadcaster), one `user` →
many `Comment` (as author).

### `livestream`
One row per broadcast session (a "go live" click, or a scheduled stream).

| Field | Notes |
|---|---|
| `id` | `cuid()` primary key. **This id doubles as the LiveKit room name** everywhere in the app (`createBroadcastSession`, `createReconnectSession`, `createViewerSession`, `endBroadcastRoom`, and the webhook handler all treat `livestream.id === LiveKit room name`). There is no separate `roomName` column. |
| `status` | `livestream_status` enum: `LIVE`, `SCHEDULED`, `ENDED`. |
| `selectedTags` | `Json` — an array of up to 3 tag strings (validated in `createLivestream`), matched against `christianTags` on the client (`src/components/stream/utils/types.ts`). Searched via Prisma's `array_contains` in `search.service/`. |
| `scheduleDate` | Set only when `streamMode === "schedule"`; otherwise `null`. |
| `lastSeenAt` | Updated by `recordHeartbeat` (`POST /api/livekit/heartbeat`); read by `cleanupStaleStreams` (cron) and `handleParticipantLeft` (webhook grace period) to decide whether a `LIVE` stream is actually still being broadcast. |
| `endedAt` | Set when a stream transitions to `ENDED` (`endLivestream`, `cleanupStaleStreams`, the webhook grace-period timer). |
| `userId` | FK → `user.id`, `onDelete: Cascade` — deleting a user removes their livestreams. |

Relationships: many `livestream` → one `user`. One `livestream` → many
`Comment`.

### `Comment`
A single chat/comment message on a livestream.

| Field | Notes |
|---|---|
| `id` | `cuid()` primary key |
| `text` | Trimmed, capped at 500 characters (`comment.service/`) |
| `userId` | FK → `user.id` |
| `livestreamId` | FK → `livestream.id` |
| `createdAt` | Used to compute the `"5m ago"`-style relative time returned by the API (never sent to the client directly) |

## Which services touch which models

| Service | Models |
|---|---|
| `auth.service/` | `user` |
| `livestream.service/` | `livestream` (and reads `user` once, in `createLivestream`, to resolve the owning user id) |
| `comment.service/` | `Comment`, `livestream` (existence check) |
| `livekit.service/` | `livestream` (via `livestream.service/`, and directly for reconnect/viewer/webhook lookups) |
| `search.service/` | `livestream` |

## Constraints worth knowing

- `user.email` is unique — both `registerUser` and `findOrCreateGoogleUser`
  rely on this, and `registerUser` also catches the Prisma `P2002` unique-
  constraint error as a fallback in case two signups race past the
  pre-check.
- There is intentionally no unique constraint tying a `user` to at most one
  `LIVE` livestream at the database level — that invariant is enforced in
  application code (`getActiveLivestreamForUser`, `createReconnectSession`)
  rather than the schema.
