# Database Schema

Defined in [`prisma/schema.prisma`](../../prisma/schema.prisma), PostgreSQL
(hosted on Supabase) via `@prisma/adapter-pg`. The Prisma client is a
singleton exported from [`src/lib/prisma.ts`](../../src/lib/prisma.ts)
(cached on `globalThis` in development to survive hot reload).

**Provider history**: this was MySQL/MariaDB (`@prisma/adapter-mariadb`)
until switched to PostgreSQL. The switch required one schema change beyond
the datasource `provider` line: `livestream`'s `userId` FK and its `@@index`
had both been given the same `map` name (`Livestream_userId_fkey`) — legal
in MySQL, where foreign keys and indexes are separate namespaces, but
rejected by PostgreSQL, which shares one namespace across all constraints/
indexes on a table. The index's explicit name was dropped (Prisma
auto-generates a distinct one) rather than renaming the FK, since nothing
else referenced that name. Everything else in the schema (enums, `Json`
fields, `@default(cuid())`, `map` on unique constraints) is provider-
agnostic and needed no changes.

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
| `deletedAt` | Soft-delete marker (moderation) — excluded from `listCommentsForStream`'s query rather than the row being removed. See [livestream/moderation.md](livestream/moderation.md). |

### `Follow`

One row per follower → streamer relationship.

| Field | Notes |
|---|---|
| `id`, `createdAt` | Standard |
| `followerId`, `followingId` | Both FK → `user.id`, distinct relation names (`Follower`/`Following`) since there are two FKs to the same model. `onDelete: Cascade` on both. |
| — | `@@unique([followerId, followingId])` — the actual duplicate-follow guard; app code also checks self-follow (`followerId === followingId`) before hitting the database. |

See [livestream/followers.md](livestream/followers.md).

### `Report`

A stored abuse report — no admin UI reads these in this MVP; they exist so
reports land somewhere durable.

| Field | Notes |
|---|---|
| `id`, `createdAt` | Standard |
| `reporterId` | FK → `user.id` |
| `targetType` | `ReportTargetType` enum: `LIVESTREAM` \| `COMMENT` |
| `targetId` | Not a FK — deliberately untyped so one column covers either target type; validity is enforced in `report.service`, not the schema |
| `reason` | Free text, capped at 500 chars in the service layer |

See [livestream/moderation.md](livestream/moderation.md).

### New `livestream` fields (this pass)

| Field | Notes |
|---|---|
| `category` | `StreamCategory` enum, `@default(Other)` (existing rows backfilled to `Other` when this migration ran) |
| `genre` | `StreamGenre` enum, same default/backfill |
| `thumbnailUrl` | `String?` — field exists; no upload pipeline built yet |
| `startedAt` | `DateTime?` — set when a stream actually goes `LIVE`, distinct from `createdAt` (a scheduled stream is created before it starts) |
| `peakViewerCount`, `totalViewCount` | `Int @default(0)` — see [livestream/viewer-statistics.md](livestream/viewer-statistics.md) for how each is computed |
| `donationEnabled`, `donationBankName`, `donationAccountName`, `donationAccountNumber` | See [livestream/donations.md](livestream/donations.md) |

Indexes added: `@@index([category])`, `@@index([genre])`,
`@@index([startedAt])` (alongside the pre-existing `userId`/`status`
indexes) — these are exactly the fields `search.service` filters on.

### New `user` fields (this pass)

| Field | Notes |
|---|---|
| `bio`, `avatarUrl` | `String?` — support the streamer profile display (`TitleCard`, follower list). No editing UI built in this pass; set to `null` for every existing/new user until one is added. |

## Which services touch which models

| Service | Models |
|---|---|
| `auth.service/` | `user` |
| `livestream.service/` | `livestream` (and reads `user` once, in `createLivestream`, to resolve the owning user id) |
| `comment.service/` | `Comment`, `livestream` (existence/ownership checks) |
| `livekit.service/` | `livestream` (via `livestream.service/`, and directly for reconnect/viewer/webhook lookups) |
| `search.service/` | `livestream` |
| `follow.service/` | `Follow`, `user` |
| `viewer-stats.service/` | `livestream` (aggregates), plus `follow.service` for follower counts |
| `report.service/` | `Report` |

## Constraints worth knowing

- `user.email` is unique — both `registerUser` and `findOrCreateGoogleUser`
  rely on this, and `registerUser` also catches the Prisma `P2002` unique-
  constraint error as a fallback in case two signups race past the
  pre-check.
- There is intentionally no unique constraint tying a `user` to at most one
  `LIVE` livestream at the database level — that invariant is enforced in
  application code (`getActiveLivestreamForUser`, `createReconnectSession`)
  rather than the schema.
