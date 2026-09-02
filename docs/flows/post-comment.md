# Flow: Posting and Receiving a Comment

A comment is delivered two ways at once: persisted to the database (so it
shows up for anyone who loads the stream later) and broadcast live over
LiveKit's data channel (so viewers already in the room see it instantly,
without polling).

## Posting

```text
Comment form submit (comments-rail.tsx)
  ↓
useSendComment() (src/components/home/utils/comment_send.ts)
  ↓
POST /api/livestreams/comments/[streamId]   { text }
  ↓
route.ts → createCommentController
  ↓
  - getCurrentSession() → 401 if signed out
  - createComment(streamId, session.user.id, text)   [comment.service/]
      - trims + length-checks the text (max 500 chars)
      - confirms the livestream exists
      - creates the `Comment` row
  ↓
{ id, name, text, time: "Just now" }
  ↓
Client:
  1. Appends the comment to local state immediately (sender sees it right away)
  2. If connected to the LiveKit room, publishes the same comment as a
     data message: room.localParticipant.publishData(
       JSON.stringify({ type: "comment", comment }), { reliable: true }
     )
```

## Receiving

Two independent paths add a comment to a viewer's UI:

- **Live, via LiveKit**: `useCommentListener()`
  (`src/components/home/utils/comment_Setup.tsx`) subscribes to
  `RoomEvent.DataReceived` on the current room. When a `{ type: "comment" }`
  payload arrives, it's appended to state (de-duplicated by `id` against
  what's already shown).
- **On load / stream switch**: `Home_context.tsx`'s effect calls
  `GET /api/livestreams/comments/[streamId]` (`listCommentsController` →
  `listCommentsForStream`) whenever the selected stream changes, so a viewer
  who just joined sees the existing comment history — LiveKit's data channel
  only delivers messages sent *after* you're connected.

Both paths write into the same `comments` state array and de-duplicate by
comment `id`, so a comment sent while you're connected doesn't show up
twice even though it could theoretically arrive via both the initial GET (if
it lands mid-fetch) and the realtime channel.
