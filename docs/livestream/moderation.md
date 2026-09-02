# Moderation (MVP)

Deliberately minimal — see
[../decisions/livestream-decisions.md](../decisions/livestream-decisions.md#moderation-soft-delete--stored-reports-no-admin-ui)
for why nothing more elaborate was built.

## Comment deletion (soft delete)

`DELETE /api/livestreams/comments/[streamId]/[commentId]`
(`comment.service/delete-comment.ts`). Sets `Comment.deletedAt` rather than
removing the row — kept for audit, excluded from
`listCommentsForStream`'s query (`where: { deletedAt: null }`).

**Authorization**: the comment's own author, or the livestream's owner —
checked against the actual `Comment.userId`/`livestream.userId` rows, never
a client claim. Anyone else gets `401`. A delete button appears in the UI
only when the viewer meets one of those two conditions:
- **Comments rail** (`src/components/home/comments-rail.tsx`): a viewer
  sees the delete affordance only on their own comments.
- **Streamer dashboard** (`src/components/stream/live/LiveView.tsx`): the
  streamer sees it on every comment on their own stream.

## Reporting

`POST /api/reports` (`report.service/create-report.ts`), auth required.
Body: `{ targetType: "LIVESTREAM" | "COMMENT", targetId, reason }`. Stored
in the `Report` table for later human review — **there is no admin UI in
this MVP** to browse or act on reports; this endpoint exists so abuse
reports land somewhere durable instead of nowhere.

## Rate limiting

`checkRateLimit` (`src/lib/rate-limit.ts`), applied in
`comment.service/create-comment.ts`: 5 comments per 10 seconds per user,
in-memory sliding window. Over the limit → `429 RateLimitError`. Single-
process limitation, same as the SSE activity bus — documented, not hidden.

## Not built in this pass

Blocking/muting a user, an admin console for reports, and anything beyond
this basic set are explicitly out of scope — see the request's "Later"
bucket and [../architecture.md](../architecture.md)'s known-issues section
for what else is tracked but not done.
