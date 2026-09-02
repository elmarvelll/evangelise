# Livestream MVP

This section documents the livestream feature set built on top of the base
architecture in [../architecture.md](../architecture.md): going live,
category/genre, search, followers, realtime activity, viewer statistics,
donations, and basic moderation.

- [lifecycle.md](lifecycle.md) — scheduled/live/ended states, starting,
  ending, and how a stale stream gets cleaned up.
- [search.md](search.md) — text search + category/genre filtering +
  pagination.
- [followers.md](followers.md) — the follow system.
- [realtime-events.md](realtime-events.md) — the SSE activity feed.
- [viewer-statistics.md](viewer-statistics.md) — current/peak/total viewer
  counts and where each number comes from.
- [donations.md](donations.md) — bank-transfer support information.
- [moderation.md](moderation.md) — comment deletion, reporting, rate
  limiting.

See [../decisions/livestream-decisions.md](../decisions/livestream-decisions.md)
for *why* each of these was built the way it was, including the documented
limitations (SSE and rate-limiting are single-process; there's no admin UI
for reviewing reports).
