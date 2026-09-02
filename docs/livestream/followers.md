# Followers

## Data model

`Follow` (`prisma/schema.prisma`): `id`, `followerId`, `followingId`,
`createdAt`, `@@unique([followerId, followingId])`, both FKs to `user` with
`onDelete: Cascade` (deleting either user removes the relationship).

## API

All in `src/services/follow.service/`, exposed via:

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/users/[userId]/follow` | Required | Follow `userId`. Follower identity is always the session's own id — never a client-supplied value. |
| `DELETE /api/users/[userId]/follow` | Required | Unfollow. Idempotent — unfollowing someone you don't follow succeeds silently. |
| `GET /api/users/[userId]/follow-status` | Public | `{ followerCount, isFollowing }` — `isFollowing` is only meaningful (and only computed) for a signed-in caller. |

## Guards

- **Self-follow**: `followUser` throws `ValidationError` if `followerId ===
  followingId` → `400`.
- **Duplicate follow**: the database's unique constraint is the real guard;
  a duplicate `POST` throws `ConflictError` → `409`.
- **Target must exist**: `ValidationError` → `400` if `followingId` isn't a
  real user.

## Frontend

`useFollow` (`src/components/home/utils/use-follow.ts`) fetches the real
follow-status on mount/stream-change and optimistically updates on
follow/unfollow, rolling back if the request fails. `FollowButton`
(`src/components/home/follow-button.tsx`) renders in `TitleCard`, disabled
with a "Sign in to follow" hint for signed-out viewers. Real follower
counts throughout — `0 followers` renders as `0 followers`, never hidden or
faked.

## Streamer-facing follower info

- **Realtime**: a successful follow publishes a `follow` SSE event to the
  target streamer's activity feed (see
  [realtime-events.md](realtime-events.md)) while they're live.
- **Aggregate**: `GET /api/users/[userId]/stats` includes `followerCount` —
  rendered in the streamer dashboard's Stats panel
  (`src/components/stream/stats-panel.tsx`).
